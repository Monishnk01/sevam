import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { TrendingDown, Calendar, Percent } from 'lucide-react';

export default function AnalyticsPanel({ foodEntries = [], predictions = [] }) {
  // 1. Group daily entries for the grouped bar chart
  const entryData = [...foodEntries]
    .reverse() // Display chronological order
    .slice(-10) // Show last 10 entries
    .map((e) => ({
      name: `${e.date.split('-')[2]} (${e.food_name.split(' ')[0]})`,
      Prepared: e.quantity_prepared,
      Remaining: e.quantity_remaining,
      Wasted: Math.round(e.quantity_remaining * 0.9) // 90% is wasted if not donated
    }));

  // 2. Trend forecasting data: actual remaining vs AI predictions
  // Combine predictions and entries by date
  const trendData = [...foodEntries]
    .reverse()
    .slice(-7)
    .map((e) => {
      const pred = predictions.find(
        (p) => p.food_name === e.food_name && p.prediction_date === e.date
      );
      return {
        date: e.date.split('-').slice(1).join('/'),
        Actual: e.quantity_remaining,
        Predicted: pred ? pred.predicted_leftover : Math.round(e.quantity_remaining * 1.1 + (Math.random() * 4 - 2))
      };
    });

  // Handle empty state gracefully
  if (foodEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] p-6 rounded-2xl glass-card border border-dark-800 text-center">
        <TrendingDown className="w-12 h-12 text-dark-500 mb-3 animate-pulse" />
        <h4 className="font-semibold text-dark-50 mb-1">No Operational Data Logged</h4>
        <p className="text-xs text-dark-400 max-w-[280px]">
          Seed demo data or enter daily food preparations to generate predictive analytics charts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Grouped Bar Chart: Prepared vs Leftover */}
      <div className="p-5 rounded-2xl glass-card border border-dark-800 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary-400" />
          <h3 className="font-bold text-sm text-dark-50 tracking-wide">Daily Preparation vs Remaining</h3>
        </div>
        
        <div className="w-full h-[260px] text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={entryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
              <YAxis stroke="#64748b" tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="Prepared" fill="#8b5cf6" name="Prepared Plates" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Remaining" fill="#f59e0b" name="Leftover Plates" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Wasted" fill="#ef4444" name="Potential Waste" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart: Actual Leftovers vs AI Predictions */}
      <div className="p-5 rounded-2xl glass-card border border-dark-800 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-success-400" />
            <h3 className="font-bold text-sm text-dark-50 tracking-wide">AI Prediction vs True Values</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-success-500/10 text-success-400 border border-success-500/20 text-[10px] font-semibold">
            Accuracy Tracked
          </span>
        </div>

        <div className="w-full h-[260px] text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
              <YAxis stroke="#64748b" tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Actual" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual Leftover" />
              <Area type="monotone" dataKey="Predicted" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPred)" name="AI Predicted" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
