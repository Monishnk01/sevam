import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, ShieldAlert, Layers, Clock, PlusCircle, ClipboardList } from 'lucide-react';
import { getDonations, acceptDonation, updateDonationStatus, addRequirement, getRequirements } from '../firebase';

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
};

export default function ReceiverDashboard({ user }) {
  const [availableDonations, setAvailableDonations] = useState([]);
  const [incomingDeliveries, setIncomingDeliveries] = useState([]);
  const [myRequirements, setMyRequirements] = useState([]);
  
  const [loadingId, setLoadingId] = useState(null);
  const [loadingReq, setLoadingReq] = useState(false);

  // Form states
  const [foodCategory, setFoodCategory] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const unsubscribeDonations = getDonations((data) => {
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

    const unsubscribeRequirements = getRequirements((data) => {
      // Requirements posted by this Receiver
      const myReqs = data.filter(r => r.receiverId === user.uid && r.status === 'Active');
      setMyRequirements(myReqs);
    });

    return () => {
      unsubscribeDonations();
      unsubscribeRequirements();
    };
  }, [user]);

  const handleAcceptDonation = async (donation) => {
    setLoadingId(donation.id);
    try {
      await withTimeout(acceptDonation(donation.id, donation, user), 4000);
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        alert('Warning: Cloud sync took too long. Saved to local cache, but Firebase is unresponsive.');
      } else {
        console.error(err);
        alert('Error accepting donation.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkReceived = async (donationId) => {
    setLoadingId(donationId);
    try {
      await withTimeout(updateDonationStatus(donationId, 'Delivered'), 4000);
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        alert('Warning: Cloud sync took too long. Saved to local cache, but Firebase is unresponsive.');
      } else {
        console.error(err);
        alert('Error marking as received.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleSubmitRequirement = async (e) => {
    e.preventDefault();
    setLoadingReq(true);
    try {
      await withTimeout(addRequirement({
        foodCategory: foodCategory || 'Any',
        quantityNeeded: Number(quantityNeeded) || 0,
        location: location || 'Unknown',
        urgency: urgency || 'Medium',
        notes: notes || '',
        receiverName: user.name || 'Unknown',
        receiverEmail: user.email || '',
        receiverId: user.uid
      }), 4000);
      
      setFoodCategory('');
      setQuantityNeeded('');
      setLocation('');
      setUrgency('Medium');
      setNotes('');
      alert('Requirement posted successfully!');
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        alert('Warning: Cloud sync took too long. Saved locally, but Firebase is unresponsive.');
      } else {
        console.error(err);
        alert('Error posting requirement.');
      }
    } finally {
      setLoadingReq(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start text-left">
      
      {/* Left Column: Post Requirement Form */}
      <div className="w-full lg:w-1/3 p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-6 sticky top-8">
        <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
          <PlusCircle className="w-4 h-4 text-primary-400" />
          Post Food Requirement
        </h3>
        
        <form onSubmit={handleSubmitRequirement} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Food Category Needed</label>
            <input 
              type="text" 
              placeholder="e.g. Rice & Curry, Bread, Any"
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-800 text-sm text-dark-50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Qty Needed (kg)</label>
              <input 
                type="number" 
                min="1"
                placeholder="0"
                value={quantityNeeded}
                onChange={(e) => setQuantityNeeded(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-800 text-sm text-dark-50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Urgency</label>
              <select 
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-800 text-sm text-dark-50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Drop-off Location</label>
            <input 
              type="text" 
              placeholder="Full address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-800 text-sm text-dark-50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Notes (Optional)</label>
            <textarea 
              placeholder="Any specific instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-800 text-sm text-dark-50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 transition-all resize-none h-20"
            />
          </div>

          <button 
            type="submit"
            disabled={loadingReq}
            className="mt-2 w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-dark-50 font-bold transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50"
          >
            {loadingReq ? 'Posting...' : 'Post Requirement'}
          </button>
        </form>
      </div>

      {/* Right Column: Tables */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        
        {/* My Active Requirements Table */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            My Active Requirements
          </h3>

          <div className="overflow-x-auto rounded-xl border border-dark-800">
            <table className="w-full text-left text-xs text-dark-300">
              <thead className="bg-dark-900/50 text-dark-400 border-b border-dark-800">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase">ID</th>
                  <th className="px-4 py-3 font-semibold uppercase">Category</th>
                  <th className="px-4 py-3 font-semibold uppercase">Qty Needed</th>
                  <th className="px-4 py-3 font-semibold uppercase">Urgency</th>
                  <th className="px-4 py-3 font-semibold uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {myRequirements.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-dark-500">No active requirements posted.</td>
                  </tr>
                ) : (
                  myRequirements.map(req => (
                    <tr key={req.id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-dark-50">{req.requirementId}</td>
                      <td className="px-4 py-3 font-semibold text-dark-50">{req.foodCategory}</td>
                      <td className="px-4 py-3">{req.quantityNeeded} kg</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          req.urgency === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          req.urgency === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                          'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-warning-400">{req.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Donations Table */}
        <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <Layers className="w-4 h-4 text-warning-400" />
            Available Food Donations (Ready to Claim)
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
                  <th className="px-4 py-3 font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {availableDonations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
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
                    <td colSpan="5" className="px-4 py-8 text-center text-dark-500">No incoming deliveries.</td>
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
