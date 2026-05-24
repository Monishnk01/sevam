import os
import sys
import json
import sqlite3
import argparse
import pandas as pd
import numpy as np
from datetime import datetime
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.sqlite')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def compute_features(df):
    """
    Computes lag features, day of week, and historical trends for food entries.
    Expects df sorted by date ascending for each food item.
    """
    df = df.copy()
    df['date_dt'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['date_dt'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Sort to compute rolling features correctly
    df = df.sort_values(by=['food_name', 'date_dt'])
    
    # Shift to get "previous leftover" (lag 1)
    df['prev_leftover'] = df.groupby('food_name')['quantity_remaining'].shift(1)
    # Default first entry's lag to 0
    df['prev_leftover'] = df['prev_leftover'].fillna(0)
    
    # 7-day rolling average of remaining quantity (historical trend)
    # Excluding current day by shifting first
    df['historical_trend'] = df.groupby('food_name')['quantity_remaining'].shift(1).rolling(window=7, min_periods=1).mean()
    df['historical_trend'] = df['historical_trend'].fillna(0)
    
    return df

def train_model(restaurant_id):
    conn = get_db_connection()
    query = """
        SELECT food_name, quantity_prepared, quantity_remaining, date, time_slot
        FROM food_entries
        WHERE restaurant_id = ?
        ORDER BY date ASC
    """
    df = pd.read_sql_query(query, conn, params=[restaurant_id])
    conn.close()
    
    if len(df) < 14:
        return {
            "success": False,
            "message": f"Insufficient data: only {len(df)} records found. Need at least 14 days of data to train."
        }
    
    # Engineer features
    df_feat = compute_features(df)
    
    # Encode categorical features: food_name
    le = LabelEncoder()
    df_feat['food_name_encoded'] = le.fit_transform(df_feat['food_name'])
    
    # Define features and targets
    X_cols = ['food_name_encoded', 'quantity_prepared', 'prev_leftover', 'day_of_week', 'is_weekend', 'historical_trend']
    X = df_feat[X_cols]
    y = df_feat['quantity_remaining']
    
    # Train Random Forest Regressor
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    # Save the model, label encoder, and column schema
    model_path = os.path.join(MODELS_DIR, f"restaurant_{restaurant_id}.joblib")
    joblib.dump({
        'model': model,
        'label_encoder': le,
        'features': X_cols,
        'last_updated': datetime.now().isoformat()
    }, model_path)
    
    return {
        "success": True,
        "message": f"Successfully trained personalized Random Forest model using {len(df_feat)} entries.",
        "model_path": model_path
    }

def predict_surplus(restaurant_id, food_name, quantity_prepared, target_date_str):
    model_path = os.path.join(MODELS_DIR, f"restaurant_{restaurant_id}.joblib")
    if not os.path.exists(model_path):
        return {
            "success": False,
            "message": "Model not trained yet. Restaurant requires 14 days of historical data."
        }
    
    # Load model package
    model_package = joblib.load(model_path)
    model = model_package['model']
    le = model_package['label_encoder']
    
    # Resolve label encoding
    try:
        food_encoded = le.transform([food_name])[0]
    except ValueError:
        # If new food item not seen during training, use a fallback category or map to the closest/first class
        food_encoded = 0
    
    # Compute calendar features for target date
    target_dt = pd.to_datetime(target_date_str)
    day_of_week = target_dt.dayofweek
    is_weekend = 1 if day_of_week in [5, 6] else 0
    
    # Fetch historical stats for lag features
    conn = get_db_connection()
    query = """
        SELECT quantity_remaining, date
        FROM food_entries
        WHERE restaurant_id = ? AND food_name = ? AND date < ?
        ORDER BY date DESC
        LIMIT 7
    """
    rows = conn.execute(query, [restaurant_id, food_name, target_date_str]).fetchall()
    conn.close()
    
    if len(rows) > 0:
        prev_leftover = rows[0]['quantity_remaining']
        historical_trend = np.mean([r['quantity_remaining'] for r in rows])
    else:
        prev_leftover = 0.0
        historical_trend = 0.0
        
    # Prepare input vector
    input_data = pd.DataFrame([{
        'food_name_encoded': food_encoded,
        'quantity_prepared': float(quantity_prepared),
        'prev_leftover': float(prev_leftover),
        'day_of_week': int(day_of_week),
        'is_weekend': int(is_weekend),
        'historical_trend': float(historical_trend)
    }])
    
    # Predict expected leftover quantity
    prediction = model.predict(input_data)[0]
    # Bound the prediction so it cannot be negative or exceed prepared quantity
    predicted_leftover = max(0.0, min(float(quantity_prepared), float(prediction)))
    
    # Probable food waste amount (leftovers that would spoil, let's assume 80% of unsold food is wasted unless donated)
    predicted_waste = predicted_leftover * 0.9
    
    return {
        "success": True,
        "food_name": food_name,
        "prediction_date": target_date_str,
        "predicted_leftover": round(predicted_leftover, 2),
        "predicted_waste": round(predicted_waste, 2),
        "features_used": {
            "prev_leftover": round(prev_leftover, 2),
            "historical_trend": round(historical_trend, 2),
            "day_of_week": int(day_of_week)
        }
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Autonomous Waste Prediction AI Agent")
    parser.add_argument('--action', choices=['train', 'predict'], required=True)
    parser.add_argument('--restaurant', required=True)
    parser.add_argument('--food', required=False)
    parser.add_argument('--prepared', type=float, required=False)
    parser.add_argument('--date', required=False)
    
    args = parser.parse_args()
    
    if args.action == 'train':
        res = train_model(args.restaurant)
        print(json.dumps(res))
    elif args.action == 'predict':
        if not args.food or args.prepared is None or not args.date:
            print(json.dumps({
                "success": False,
                "message": "Missing required arguments for prediction (food, prepared, date)."
            }))
            sys.exit(1)
        res = predict_surplus(args.restaurant, args.food, args.prepared, args.date)
        print(json.dumps(res))
