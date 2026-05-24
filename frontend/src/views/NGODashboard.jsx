import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Truck, 
  MapPin, 
  CheckCircle, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import CustomMap from '../components/CustomMap';

export default function NGODashboard({ user, notifications }) {
  const [restaurants, setRestaurants] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchNgoData();
  }, [notifications]); // Refresh when WebSocket notification arrives

  const fetchNgoData = async () => {
    try {
      const resRest = await fetch(`${API_URL}/restaurants`);
      const dataRest = await resRest.json();
      if (dataRest.success) setRestaurants(dataRest.list);

      const resRecv = await fetch(`${API_URL}/receivers`);
      const dataRecv = await resRecv.json();
      if (dataRecv.success) setReceivers(dataRecv.list);

      const resDon = await fetch(`${API_URL}/donations`);
      const dataDon = await resDon.json();
      if (dataDon.success) setDonations(dataDon.donations);
    } catch (err) {
      console.error('Error fetching NGO data:', err);
    }
  };

  const handleAcceptPickup = async (donationId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/donations/${donationId}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        fetchNgoData();
      } else {
        alert(data.message || 'Failed to accept pickup');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverPickup = async (donationId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/donations/${donationId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        fetchNgoData();
      } else {
        alert(data.message || 'Failed to confirm delivery');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API.');
    } finally {
      setLoading(false);
    }
  };

  // Filter lists
  const availableDonations = donations.filter((d) => d.status === 'pending');
  const activePickups = donations.filter((d) => d.status === 'assigned' || d.status === 'picked_up');

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* 1. Radar Map Visualization Banner */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Redistribution Radar Command
          </h2>
          <p className="text-xs text-dark-400">
            Real-time visual map displaying spatial locations of active surplus food requests and receiver shelters.
          </p>
        </div>

        <CustomMap 
          restaurants={restaurants} 
          receivers={receivers} 
          activeDonations={donations} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* 2. Available Surplus Queue */}
        <div className="xl:col-span-6 p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5 h-[480px]">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Layers className="w-4 h-4 text-warning-400" />
            Active Food Surpluses Detected
          </h3>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-2">
            {availableDonations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-dark-800 rounded-xl">
                <ShieldAlert className="w-8 h-8 text-dark-500 mb-2 animate-pulse" />
                <h4 className="font-semibold text-white text-xs mb-1">No Surpluses Available</h4>
                <p className="text-[10px] text-dark-400 max-w-[240px]">
                  All predicted and logged food surpluses have been successfully claimed or no active restaurants have surplus right now.
                </p>
              </div>
            ) : (
              availableDonations.map((don) => (
                <div 
                  key={don.id}
                  className="p-4 rounded-xl border border-dark-800 bg-dark-900/30 flex items-center justify-between gap-4 glass-card-hover"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-xs text-white truncate">{don.food_name}</span>
                      <span className="shrink-0 px-2 py-0.5 rounded bg-warning-500/10 text-warning-400 border border-warning-500/20 text-[9px] font-bold">
                        {don.quantity} plates
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-[10px] text-dark-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span className="truncate">{don.restaurant_name} ({don.restaurant_address})</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptPickup(don.id)}
                    disabled={loading}
                    className="shrink-0 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-primary-500/10"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Accept Route</span>
                  </button>

                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. My Active Pickup Routes */}
        <div className="xl:col-span-6 p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5 h-[480px]">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Truck className="w-4 h-4 text-success-400" />
            My Active Delivery Routes
          </h3>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-2">
            {activePickups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-dark-800 rounded-xl">
                <CheckCircle className="w-8 h-8 text-dark-500 mb-2 animate-pulse" />
                <h4 className="font-semibold text-white text-xs mb-1">Routes Clear</h4>
                <p className="text-[10px] text-dark-400 max-w-[240px]">
                  No assigned pickups in your queue. Accept pending surpluses on the left to start cargo redistribution.
                </p>
              </div>
            ) : (
              activePickups.map((don) => (
                <div 
                  key={don.id}
                  className="p-4 rounded-xl border border-primary-500/10 bg-primary-500/5 flex flex-col gap-3.5"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-dark-800">
                    <div>
                      <span className="font-bold text-xs text-white">{don.food_name}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 text-[8px] font-bold">
                        {don.quantity} plates
                      </span>
                    </div>

                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold animate-pulse">
                      In Transit
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-[10px] text-dark-300">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                      <span className="truncate"><strong>From:</strong> {don.restaurant_name} ({don.restaurant_address})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-400 shrink-0" />
                      <span className="truncate"><strong>To Shelter:</strong> Bangalore Food Shelter Node</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeliverPickup(don.id)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-success-500/10"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Dropoff & Deliver</span>
                  </button>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
