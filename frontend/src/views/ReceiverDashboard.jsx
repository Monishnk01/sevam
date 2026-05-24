import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Layers, 
  CheckCircle, 
  History, 
  Trash2, 
  Clock,
  Battery,
  AlertCircle
} from 'lucide-react';

export default function ReceiverDashboard({ user, notifications }) {
  const [capacity, setCapacity] = useState(300);
  const [capacityUsed, setCapacityUsed] = useState(0);
  const [incomingDrops, setIncomingDrops] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchReceiverData();
  }, [notifications]); // Refresh on incoming WebSockets

  const fetchReceiverData = async () => {
    try {
      // 1. Fetch receivers profile
      const resRecv = await fetch(`${API_URL}/receivers`);
      const dataRecv = await resRecv.json();
      if (dataRecv.success) {
        // Find our profile
        const profile = dataRecv.list.find((r) => r.user_id === user.id);
        if (profile) {
          setCapacity(profile.capacity);
          setCapacityUsed(profile.capacity_used);
        }
      }

      // 2. Fetch all donations to filter incoming & complete drops
      const resDon = await fetch(`${API_URL}/donations`);
      const dataDon = await resDon.json();
      if (dataDon.success) {
        // Mock filter based on assigned/delivered targets since they are matched dynamically in backend
        const incoming = dataDon.donations.filter((d) => d.status === 'assigned' || d.status === 'picked_up');
        const history = dataDon.donations.filter((d) => d.status === 'delivered');
        
        setIncomingDrops(incoming);
        setDeliveryHistory(history);
      }
    } catch (err) {
      console.error('Error fetching receiver data:', err);
    }
  };

  const handleResetCapacity = async () => {
    // Front-end state reset for simulation
    setCapacityUsed(0);
  };

  // Capacity calculation percentage
  const usagePercentage = Math.round((capacityUsed / capacity) * 100);

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* 1. Capacity and Intake Level Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Intake capacity visualizer card */}
        <div className="lg:col-span-4 p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Battery className="w-4 h-4 text-success-400" />
            Shelter Capacity Level
          </h3>

          <div className="flex flex-col items-center py-6 text-center">
            
            {/* Visual Circular/Dial Percentage representation */}
            <div className="relative w-36 h-36 rounded-full border-4 border-dark-800 flex items-center justify-center mb-4">
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-success-500 border-r-success-500 transition-all duration-500"
                style={{
                  transform: `rotate(${Math.min(360, (usagePercentage / 100) * 360)}deg)`
                }}
              />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-white font-mono leading-none">
                  {usagePercentage}%
                </span>
                <span className="text-[9px] text-dark-400 font-bold uppercase mt-1">Intake Used</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full text-xs mb-4">
              <div className="flex justify-between text-dark-300">
                <span>Used Capacity:</span>
                <strong className="text-white font-mono">{Math.round(capacityUsed)} meals</strong>
              </div>
              <div className="flex justify-between text-dark-300">
                <span>Maximum Capacity:</span>
                <strong className="text-white font-mono">{capacity} meals</strong>
              </div>
            </div>

            <button
              onClick={handleResetCapacity}
              className="w-full py-2.5 rounded-xl border border-danger-500/20 bg-danger-500/5 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Daily Capacity</span>
            </button>

          </div>
        </div>

        {/* Right Side: Operations Control Pane */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          {/* Pending Shipments in transit */}
          <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-warning-400 animate-pulse" />
              Incoming Cargo Drops in Transit
            </h3>

            <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
              {incomingDrops.length === 0 ? (
                <div className="text-center py-6 text-xs text-dark-500 flex items-center justify-center gap-2 bg-dark-900/10 border border-dark-800 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>No incoming active deliveries currently in transit.</span>
                </div>
              ) : (
                incomingDrops.map((don) => (
                  <div key={don.id} className="p-3.5 rounded-xl border border-dark-800 bg-dark-900/40 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white">{don.food_name}</strong>
                      <div className="text-[10px] text-dark-400 mt-1">
                        From restaurant: <span className="text-primary-400 font-semibold">{don.restaurant_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded bg-warning-500/10 border border-warning-500/20 text-warning-400 font-bold text-[9px] uppercase tracking-wide animate-pulse">
                        {don.quantity} Meals Incoming
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historical Intakes ledger */}
          <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
              <History className="w-4 h-4 text-primary-400" />
              Historical Intakes Ledger
            </h3>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {deliveryHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-dark-500">
                  No completed delivery dropoffs recorded in database.
                </div>
              ) : (
                deliveryHistory.map((don) => (
                  <div key={don.id} className="p-3.5 rounded-xl border border-dark-800 bg-dark-900/10 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white">{don.food_name}</strong>
                      <div className="text-[10px] text-dark-500 mt-0.5">
                        Delivered successfully from: <span className="text-dark-300 font-semibold">{don.restaurant_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="px-2 py-0.5 rounded bg-success-500/10 text-success-400 border border-success-500/20 text-[9px] font-bold">
                        +{don.quantity} meals saved
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
