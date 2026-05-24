import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  History, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import AnalyticsPanel from '../components/AnalyticsPanel';

export default function RestaurantDashboard({ user, notifications }) {
  const [foodName, setFoodName] = useState('Chicken Biryani');
  const [qtyPrepared, setQtyPrepared] = useState(100);
  const [qtyRemaining, setQtyRemaining] = useState(15);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('dinner');

  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [foodEntries, setFoodEntries] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [donations, setDonations] = useState([]);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboardData();
  }, [notifications]); // Re-fetch on any incoming WS notification

  const fetchDashboardData = async () => {
    if (!user.profileId) return;
    try {
      // 1. Fetch historical food entries
      const resEntries = await fetch(`${API_URL}/food-entries/${user.profileId}`);
      const dataEntries = await resEntries.json();
      if (dataEntries.success) setFoodEntries(dataEntries.entries);

      // 2. Fetch AI Predictions
      const resPredictions = await fetch(`${API_URL}/predictions/${user.profileId}`);
      const dataPredictions = await resPredictions.json();
      if (dataPredictions.success) setPredictions(dataPredictions.predictions);

      // 3. Fetch Global Donations to filter this restaurant's requests
      const resDonations = await fetch(`${API_URL}/donations`);
      const dataDonations = await resDonations.json();
      if (dataDonations.success) {
        const filtered = dataDonations.donations.filter((d) => d.restaurant_id === user.profileId);
        setDonations(filtered);
      }
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
    }
  };

  // Submit daily record form
  const handleAddEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/food-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: user.profileId,
          foodName,
          quantityPrepared: Number(qtyPrepared),
          quantityRemaining: Number(qtyRemaining),
          date,
          timeSlot
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
        // Clear or offset form inputs
        setQtyRemaining(0);
      } else {
        alert(data.message || 'Failed to submit entry');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API.');
    } finally {
      setLoading(false);
    }
  };

  // One-click demo seeder
  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_URL}/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: user.profileId })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.message || 'Seeding error.');
      }
    } catch (err) {
      console.error(err);
      alert('Error during data seeding.');
    } finally {
      setSeeding(false);
    }
  };

  // Check if enough days logged to enable the AI model
  const daysLogged = new Set(foodEntries.map((e) => e.date)).size;
  const isAiReady = daysLogged >= 14;

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* 1. Welcome Message & Seeding Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-dark-800 bg-dark-900/10 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Personalized Prediction Center
          </h2>
          <p className="text-xs text-dark-400 max-w-[500px]">
            {isAiReady 
              ? '✅ Your personalized Random Forest AI model is actively monitoring preparation patterns to forecast surplus food.'
              : `⚠️ Operational History: ${daysLogged}/14 days recorded. Feed at least 14 days of historical logs to train the prediction model.`}
          </p>
        </div>
        
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-warning-500 to-amber-600 hover:from-warning-400 hover:to-amber-500 text-dark-950 font-extrabold text-xs transition-all shadow-lg shadow-warning-500/10"
        >
          {seeding ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Provisioning History & Training AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Instantly Seed 15 Days & Train AI</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* 2. Daily Logging Form Panel */}
        <div className="xl:col-span-4 p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <PlusCircle className="w-4 h-4 text-primary-400" />
            Daily Operations Entry
          </h3>
          
          <form onSubmit={handleAddEntry} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Food Name</label>
              <select
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-primary-500"
              >
                <option value="Chicken Biryani">Chicken Biryani</option>
                <option value="Veg Fried Rice">Veg Fried Rice</option>
                <option value="Paneer Butter Masala">Paneer Butter Masala</option>
                <option value="Garlic Naan">Garlic Naan</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Quantity Prepared (Plates/Meals)</label>
              <input
                type="number"
                min="10"
                max="500"
                required
                value={qtyPrepared}
                onChange={(e) => setQtyPrepared(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Quantity Remaining at End of Day (Leftovers)</label>
              <input
                type="number"
                min="0"
                max={qtyPrepared}
                required
                value={qtyRemaining}
                onChange={(e) => setQtyRemaining(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="dinner">Dinner</option>
                  <option value="lunch">Lunch</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10"
            >
              {loading ? (
                <span>Logging Entry & Running AI...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Log Operational Day</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 3. Prediction / AI Output Dashboard Panel */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-success-400" />
              Next-Day AI Predictive Surplus
            </h3>

            {!isAiReady ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-dark-800 rounded-xl">
                <AlertTriangle className="w-10 h-10 text-warning-500 mb-2 animate-bounce" />
                <h4 className="font-semibold text-white text-sm mb-1">AI Prediction Offline</h4>
                <p className="text-xs text-dark-400 max-w-[340px] mb-4">
                  The Random Forest Regressor requires at least 14 operational days of data to compute rolling averages and previous leftover features.
                </p>
                <button
                  onClick={handleSeedData}
                  className="px-4 py-2 rounded-xl bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 border border-warning-500/30 text-xs font-bold transition-all"
                >
                  Quick Seed 15-Day History
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Predicted surplus banner */}
                <div className="p-5 rounded-xl border border-success-500/20 bg-success-500/5 text-left flex flex-col justify-between h-[160px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-success-400 text-xs font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Tomorrow's Food Surplus Forecast</span>
                    </div>
                    <p className="text-[10px] text-dark-400 mt-1">Expected plate leftover based on historical lag averages</p>
                  </div>
                  <div>
                    <span className="text-4xl font-extrabold text-white tracking-tight leading-none">
                      {predictions[0] ? predictions[0].predicted_leftover : '15–25'}
                    </span>
                    <span className="text-xs text-dark-300 ml-1.5 font-semibold">plates predicted</span>
                  </div>
                </div>

                {/* Predicted waste and action banner */}
                <div className="p-5 rounded-xl border border-primary-500/20 bg-primary-500/5 text-left flex flex-col justify-between h-[160px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-primary-400 text-xs font-bold">
                      <ArrowRight className="w-4 h-4" />
                      <span>Autonomous Redistribution Action</span>
                    </div>
                    <p className="text-[10px] text-dark-400 mt-1">Autonomous agent will coordinate pickup with local shelters</p>
                  </div>
                  <div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary-500/20 text-primary-300 font-bold border border-primary-500/30 capitalize">
                      {predictions[0] && predictions[0].predicted_leftover >= 5 ? 'Redistribution Active' : 'Hold State'}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 4. Active Redistribution Request Tracker */}
          <div className="p-6 rounded-2xl glass-card border border-dark-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide mb-4">
              <History className="w-4 h-4 text-warning-400" />
              Autonomous Redistribution Status
            </h3>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2">
              {donations.length === 0 ? (
                <div className="text-center py-6 text-xs text-dark-500">
                  No active donations listed. Entries with predicted surplus &gt; 5 plates will automatically request pickups.
                </div>
              ) : (
                donations.map((don) => (
                  <div key={don.id} className="p-3.5 rounded-xl border border-dark-800 bg-dark-900/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white leading-none">{don.food_name}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-dark-400">
                        <span className="font-semibold text-primary-400">{don.quantity} plates</span>
                        <span>•</span>
                        <span>Expires: {new Date(don.expiry_time).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      don.status === 'delivered' 
                        ? 'bg-success-500/10 border-success-500/20 text-success-400' 
                        : don.status === 'assigned' || don.status === 'picked_up'
                        ? 'bg-primary-500/10 border-primary-500/20 text-primary-400 animate-pulse'
                        : 'bg-warning-500/10 border-warning-500/20 text-warning-400'
                    } capitalize`}>
                      {don.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 5. Historical Trends & Performance Analytics Chart Panels */}
      <div className="border-t border-dark-800 pt-8">
        <h3 className="font-bold text-sm text-white mb-6 uppercase tracking-wide">
          Operational Analytics System
        </h3>
        <AnalyticsPanel foodEntries={foodEntries} predictions={predictions} />
      </div>

    </div>
  );
}
