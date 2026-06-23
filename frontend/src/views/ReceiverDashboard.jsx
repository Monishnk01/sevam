import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, ShieldAlert, Layers, Clock } from 'lucide-react';
import { getDonations, acceptDonation, updateDonationStatus } from '../firebase';

export default function ReceiverDashboard({ user }) {
  const [availableDonations, setAvailableDonations] = useState([]);
  const [incomingDeliveries, setIncomingDeliveries] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const unsubscribe = getDonations((data) => {
      // Pending donations available to accept
      const available = data.filter(d => d.status === 'Pending');
      
      // Donations claimed by this Receiver
      const incoming = data.filter(d => 
        (d.status === 'Claimed' || d.status === 'In Transit') && 
        d.acceptedById === user.uid
      );

      setAvailableDonations(available);
      setIncomingDeliveries(incoming);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcceptDonation = async (donation) => {
    setLoadingId(donation.id);
    try {
      await acceptDonation(donation.id, donation, user);
    } catch (err) {
      console.error(err);
      alert('Error accepting donation.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkReceived = async (donationId) => {
    setLoadingId(donationId);
    try {
      await updateDonationStatus(donationId, 'Delivered');
    } catch (err) {
      console.error(err);
      alert('Error marking as received.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="grid grid-cols-1 gap-8 items-start">
        
        {/* Available Donations Table */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Layers className="w-4 h-4 text-warning-400" />
            Available Food Donations
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
                          onClick={() => handleAcceptDonation(don)}
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

        {/* Incoming Deliveries Table */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Clock className="w-4 h-4 text-success-400" />
            My Accepted / Incoming Donations
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
                {incomingDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center">No incoming deliveries.</td>
                  </tr>
                ) : (
                  incomingDeliveries.map(don => (
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
                          onClick={() => handleMarkReceived(don.id)}
                          disabled={loadingId === don.id}
                          className="w-fit py-1.5 px-3 rounded-lg bg-success-600 hover:bg-success-500 text-dark-50 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Received</span>
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
