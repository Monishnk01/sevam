import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle, ShieldAlert, Layers, ClipboardList } from 'lucide-react';
import { getDonations, acceptDonation, updateDonationStatus, getRequirements } from '../firebase';

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
};

export default function NGODashboard({ user }) {
  const [availableDonations, setAvailableDonations] = useState([]);
  const [activePickups, setActivePickups] = useState([]);
  const [receiverRequirements, setReceiverRequirements] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const unsubscribeDonations = getDonations((data) => {
      // Filter for Pending donations for all
      const available = data.filter(d => d.status === 'Pending');
      
      // Filter for donations claimed by THIS distributor that are not delivered yet
      const active = data.filter(d => 
        (d.status === 'Claimed' || d.status === 'In Transit') && 
        d.acceptedById === user.uid
      );

      setAvailableDonations(available);
      setActivePickups(active);
    });

    const unsubscribeRequirements = getRequirements((data) => {
      // Show all active requirements from receivers
      const activeReqs = data.filter(r => r.status === 'Active');
      setReceiverRequirements(activeReqs);
    });

    return () => {
      unsubscribeDonations();
      unsubscribeRequirements();
    };
  }, [user]);

  const handleAcceptPickup = async (donation) => {
    setLoadingId(donation.id);
    try {
      await withTimeout(acceptDonation(donation.id, donation, user), 4000);
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        alert('Warning: Cloud sync took too long. It was saved to your local cache, but your Firebase database is unresponsive.');
      } else {
        console.error(err);
        alert('Error accepting donation.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeliverPickup = async (donationId) => {
    setLoadingId(donationId);
    try {
      await withTimeout(updateDonationStatus(donationId, 'Delivered'), 4000);
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        alert('Warning: Cloud sync took too long. It was saved to your local cache, but your Firebase database is unresponsive.');
      } else {
        console.error(err);
        alert('Error marking as delivered.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="grid grid-cols-1 gap-8 items-start">
        
        {/* Available Surpluses Table */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Layers className="w-4 h-4 text-warning-400" />
            Available Food Donations (Pick-ups)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-dark-800">
            <table className="w-full text-left text-xs text-dark-300">
              <thead className="bg-dark-900/50 text-dark-400 border-b border-dark-800">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase">ID</th>
                  <th className="px-4 py-3 font-semibold uppercase">Food Name</th>
                  <th className="px-4 py-3 font-semibold uppercase">Qty (kg)</th>
                  <th className="px-4 py-3 font-semibold uppercase">Donor</th>
                  <th className="px-4 py-3 font-semibold uppercase">Pickup Location</th>
                  <th className="px-4 py-3 font-semibold uppercase">Expiry</th>
                  <th className="px-4 py-3 font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {availableDonations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-dark-500" />
                        <span>No Pending Donations Available.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  availableDonations.map(don => (
                    <tr key={don.id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-dark-50">{don.donationId}</td>
                      <td className="px-4 py-3 font-semibold text-dark-50">{don.foodName}</td>
                      <td className="px-4 py-3">{don.quantityKg} kg</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-dark-50">{don.donorName}</span>
                          <span className="text-[10px]">{don.donorEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 truncate max-w-[150px]">{don.pickupLocation}</td>
                      <td className="px-4 py-3">{don.expiryDate}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleAcceptPickup(don)}
                          disabled={loadingId === don.id}
                          className="shrink-0 py-1.5 px-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-dark-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{loadingId === don.id ? 'Claiming...' : 'Claim Donation'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receiver Requirements Table */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            Receiver Requirements (Drop-off Targets)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-dark-800">
            <table className="w-full text-left text-xs text-dark-300">
              <thead className="bg-dark-900/50 text-dark-400 border-b border-dark-800">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase">ID</th>
                  <th className="px-4 py-3 font-semibold uppercase">Receiver</th>
                  <th className="px-4 py-3 font-semibold uppercase">Needed Food</th>
                  <th className="px-4 py-3 font-semibold uppercase">Qty Needed</th>
                  <th className="px-4 py-3 font-semibold uppercase">Drop-off Location</th>
                  <th className="px-4 py-3 font-semibold uppercase">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {receiverRequirements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-dark-500">No active requirements posted by receivers.</td>
                  </tr>
                ) : (
                  receiverRequirements.map(req => (
                    <tr key={req.id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-dark-50">{req.requirementId}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-dark-50">{req.receiverName}</span>
                          <span className="text-[10px]">{req.receiverEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-dark-50">{req.foodCategory}</td>
                      <td className="px-4 py-3">{req.quantityNeeded} kg</td>
                      <td className="px-4 py-3 truncate max-w-[150px]">{req.location}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          req.urgency === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          req.urgency === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                          'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                          {req.urgency}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Delivery Routes */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Truck className="w-4 h-4 text-success-400" />
            My Active Deliveries
          </h3>

          <div className="overflow-x-auto rounded-xl border border-dark-800">
            <table className="w-full text-left text-xs text-dark-300">
              <thead className="bg-dark-900/50 text-dark-400 border-b border-dark-800">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase">ID</th>
                  <th className="px-4 py-3 font-semibold uppercase">Food Name</th>
                  <th className="px-4 py-3 font-semibold uppercase">Pickup Location</th>
                  <th className="px-4 py-3 font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {activePickups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-dark-500">No active deliveries.</td>
                  </tr>
                ) : (
                  activePickups.map(don => (
                    <tr key={don.id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-dark-50">{don.donationId}</td>
                      <td className="px-4 py-3 font-semibold text-dark-50">{don.foodName}</td>
                      <td className="px-4 py-3">{don.pickupLocation}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold border bg-amber-500/10 border-amber-500/20 text-amber-400">
                          {don.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeliverPickup(don.id)}
                          disabled={loadingId === don.id}
                          className="w-fit py-1.5 px-3 rounded-lg bg-success-600 hover:bg-success-500 text-dark-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
