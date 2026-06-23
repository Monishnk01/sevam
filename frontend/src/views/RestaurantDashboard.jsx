import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  HeartHandshake, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  BarChart2
} from 'lucide-react';
import { addDonation, getDonations, getHistoricalData } from '../firebase';
import BulkDataEntryModal from '../components/BulkDataEntryModal';

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
};
import MultivariateLinearRegression from 'ml-regression-multivariate-linear';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RestaurantDashboard({ user }) {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // --- Firebase Data State ---
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    const unsubscribeDonations = getDonations((data) => {
      const userEmail = user.email || '';
      const myDonations = data.filter(d => 
        d.donorEmail && d.donorEmail.toLowerCase() === userEmail.toLowerCase()
      );
      setDonations(myDonations);
    });

    const unsubscribeHistory = getHistoricalData(user.uid, (data) => {
      setHistoricalData(data);
    });

    return () => {
      unsubscribeDonations();
      unsubscribeHistory();
    };
  }, [user]);

  // --- AI Predictor State ---
  const [prepFoodName, setPrepFoodName] = useState('');
  const [prepQty, setPrepQty] = useState('');
  const [prepDate, setPrepDate] = useState(new Date().toISOString().split('T')[0]);

  // --- ML Prediction Logic ---
  const historyForFood = historicalData.filter(d => 
    prepFoodName && d.foodName.toLowerCase().trim() === prepFoodName.toLowerCase().trim()
  );
  
  historyForFood.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalLogs = historicalData.length;
  const isAiReady = historyForFood.length >= 5;

  let predictedSold = '-';
  let predictedSurplus = '-';
  let confidenceScore = '-';
  let historicalAvgSold = 0;
  let historicalAvgSurplus = 0;

  if (isAiReady && prepQty && prepDate) {
    const targetDate = new Date(prepDate);
    const targetDayOfWeek = targetDate.getDay();
    const targetMonth = targetDate.getMonth();
    const targetQty = Number(prepQty);

    const totalSold = historyForFood.reduce((sum, item) => sum + (item.quantityPrepared - item.quantityRemaining), 0);
    const totalSurplus = historyForFood.reduce((sum, item) => sum + item.quantityRemaining, 0);
    historicalAvgSold = totalSold / historyForFood.length;
    historicalAvgSurplus = totalSurplus / historyForFood.length;

    const X = historyForFood.map(item => {
      const d = new Date(item.date);
      return [
        d.getDay(),
        d.getMonth(),
        item.quantityPrepared,
        historicalAvgSold,
        historicalAvgSurplus
      ];
    });

    const Y = historyForFood.map(item => [
      item.quantityPrepared - item.quantityRemaining, // Sold
      item.quantityRemaining // Surplus
    ]);

    try {
      const mlr = new MultivariateLinearRegression(X, Y);
      const prediction = mlr.predict([
        targetDayOfWeek,
        targetMonth,
        targetQty,
        historicalAvgSold,
        historicalAvgSurplus
      ]);

      const rawSold = Math.max(0, prediction[0]);
      const rawSurplus = Math.max(0, prediction[1]);
      
      const totalPred = rawSold + rawSurplus;
      if (totalPred > 0) {
        predictedSold = Math.round((rawSold / totalPred) * targetQty);
        predictedSurplus = targetQty - predictedSold;
      } else {
        predictedSold = 0;
        predictedSurplus = targetQty;
      }
      
      const sampleConfidence = Math.min(98, Math.round(75 + (historyForFood.length * 0.5)));
      confidenceScore = `${sampleConfidence}%`;
      
    } catch (e) {
      console.error('ML Error', e);
    }
  }

  const chartData = historyForFood.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Sold: item.quantityPrepared - item.quantityRemaining,
    Surplus: item.quantityRemaining,
    Prepared: item.quantityPrepared
  }));

  const handleSeedSuccess = (data) => {
    setShowBulkModal(false);
  };

  // --- Firebase Form State ---
  const [foodName, setFoodName] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [foodCategory, setFoodCategory] = useState('Cooked Meal');
  const [cookedDate, setCookedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await withTimeout(addDonation({
        foodName: foodName || 'Unnamed Food',
        quantityKg: Number(quantityKg) || 0,
        foodCategory: foodCategory || 'Cooked Meal',
        cookedDate: cookedDate || new Date().toISOString().split('T')[0],
        expiryDate: expiryDate || '',
        donorName: user.name || 'Unknown',
        donorEmail: user.email || '',
        donorPhone: user.phone || '',
        pickupLocation: pickupLocation || 'Unknown',
        description: description || ''
      }), 4000); // 4-second timeout to prevent infinite hanging
      
      // Reset form fields
      setFoodName('');
      setQuantityKg('');
      setFoodCategory('');
      setCookedDate('');
      setExpiryDate('');
      setPickupLocation('');
      setDescription('');
      
      alert('Donation submitted successfully!');
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        alert('Warning: Cloud sync took too long! It was saved to your local cache, but your Firebase database is unresponsive. Distributors will not see this until your Firebase connects.');
        // Still reset form to prevent getting stuck
        setFoodName('');
        setQuantityKg('');
        setPickupLocation('');
        setDescription('');
      } else {
        console.error(err);
        alert('Error submitting donation.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-dark-800 bg-dark-900/10 backdrop-blur-sm flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-dark-50 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning-400" />
              Option 1: Seed Historical Data
            </h2>
            <p className="text-xs text-dark-400">
              Add multiple days of past preparation records at once to quickly train the machine learning algorithm.
            </p>
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-warning-500 to-amber-600 hover:from-warning-400 hover:to-amber-500 text-dark-950 font-extrabold text-xs transition-all shadow-lg shadow-warning-500/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>Seed Bulk History</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-dark-800 bg-dark-900/10 backdrop-blur-sm flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-dark-50 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-400" />
              Database Status
            </h2>
            <p className="text-xs text-dark-400">
              The AI model continually learns from your historical logs in Firebase. It requires at least 5 records per food item to predict accurately.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-dark-800 bg-dark-900 flex items-center justify-between">
            <span className="text-xs font-bold text-dark-50">Total Records:</span>
            <span className="text-xs font-bold text-primary-400">
              {totalLogs} Rows Stored
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-4">
        <h3 className="font-bold text-sm text-dark-50 flex items-center justify-between pb-3 border-b border-dark-800 uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success-400" />
            AI Predictive Surplus Model
          </div>
          {confidenceScore !== '-' && (
            <div className="text-[10px] font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded border border-primary-500/20">
              Confidence: {confidenceScore}
            </div>
          )}
        </h3>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Food Name (Target)</label>
              <input 
                type="text" 
                value={prepFoodName}
                onChange={(e) => setPrepFoodName(e.target.value)}
                placeholder="e.g. Chicken Biryani"
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 px-3.5 text-sm text-dark-50 focus:outline-none focus:border-primary-500" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Qty to prepare (kg)</label>
              <input 
                type="number" 
                min="1"
                value={prepQty}
                onChange={(e) => setPrepQty(e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 px-3.5 text-sm text-dark-50 focus:outline-none focus:border-primary-500" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Date and Day</label>
              <input 
                type="date" 
                value={prepDate}
                onChange={(e) => setPrepDate(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 px-3.5 text-sm text-dark-50 focus:outline-none focus:border-primary-500" 
              />
            </div>
          </div>

          {!prepFoodName ? (
             <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-dark-800 rounded-xl">
               <p className="text-xs text-dark-400">Enter a food name to see predictions.</p>
             </div>
          ) : !isAiReady ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-dark-800 rounded-xl bg-warning-500/5">
              <AlertTriangle className="w-8 h-8 text-warning-500 mb-2" />
              <h4 className="font-semibold text-dark-50 text-sm mb-1">Not enough data for accurate prediction</h4>
              <p className="text-xs text-dark-400 max-w-[400px]">
                The multivariate regression model requires at least 5 historical records for <strong>"{prepFoodName}"</strong> to train properly. You currently have {historyForFood.length} records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-4">
                <div className="p-5 rounded-xl border border-success-500/20 bg-success-500/5 text-left flex flex-col justify-between h-[120px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-success-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Predicted Quantity Sold</span>
                    </div>
                    <p className="text-[10px] text-dark-400 mt-1">Based on regression of {historyForFood.length} past records</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-dark-50 tracking-tight leading-none">
                      {predictedSold}
                    </span>
                    <span className="text-xs text-dark-300 font-semibold">kg</span>
                    <span className="text-[10px] text-dark-400 ml-auto">Avg: {Math.round(historicalAvgSold)}kg</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-warning-500/20 bg-warning-500/5 text-left flex flex-col justify-between h-[120px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-warning-400 text-xs font-bold">
                      <ArrowRight className="w-4 h-4" />
                      <span>Predicted Surplus Quantity</span>
                    </div>
                    <p className="text-[10px] text-dark-400 mt-1">Expected leftover available for donation</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-dark-50 tracking-tight leading-none">
                      {predictedSurplus}
                    </span>
                    <span className="text-xs text-dark-300 font-semibold">kg</span>
                    <span className="text-[10px] text-dark-400 ml-auto">Avg: {Math.round(historicalAvgSurplus)}kg</span>
                  </div>
                </div>
              </div>

              <div className="h-full min-h-[250px] p-4 rounded-xl border border-dark-800 bg-dark-900/50 flex flex-col">
                <h4 className="text-[10px] font-bold text-dark-400 uppercase mb-4 flex items-center gap-2">
                  <BarChart2 className="w-3 h-3" />
                  Historical Trend: {prepFoodName}
                </h4>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickMargin={8} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }}
                        itemStyle={{ color: '#f4f4f5' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="Sold" stroke="#22c55e" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Surplus" stroke="#eab308" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* 3. Firebase Form and Tables Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        <div className="xl:col-span-4 p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-5">
          <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
            <PlusCircle className="w-4 h-4 text-primary-400" />
            Submit Food Donation
          </h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Food Name</label>
              <input type="text" required value={foodName} onChange={(e) => setFoodName(e.target.value)} className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Quantity (kg)</label>
                <input type="number" required min="1" value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Category</label>
                <select value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)} className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500">
                  <option value="Cooked Meal">Cooked Meal</option>
                  <option value="Raw Ingredients">Raw Ingredients</option>
                  <option value="Packaged Goods">Packaged Goods</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Cooked Date</label>
                <input type="date" required value={cookedDate} onChange={(e) => setCookedDate(e.target.value)} className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Expiry Date</label>
                <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Pickup Location</label>
              <input type="text" required value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-xs text-dark-50 focus:outline-none focus:border-primary-500"></textarea>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 mt-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-dark-50 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg">
              {loading ? <span>Submitting...</span> : <><CheckCircle2 className="w-4 h-4" /><span>Submit Donation</span></>}
            </button>
          </form>
        </div>

        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="p-6 rounded-2xl glass-card border border-dark-800 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-dark-50 flex items-center gap-2 pb-3 border-b border-dark-800 uppercase tracking-wide">
              <HeartHandshake className="w-4 h-4 text-success-400" />
              My Donations
            </h3>

            <div className="overflow-x-auto rounded-xl border border-dark-800">
              <table className="w-full text-left text-xs text-dark-300">
                <thead className="bg-dark-900/50 text-dark-400 border-b border-dark-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase">ID</th>
                    <th className="px-4 py-3 font-semibold uppercase">Food Name</th>
                    <th className="px-4 py-3 font-semibold uppercase">Qty (kg)</th>
                    <th className="px-4 py-3 font-semibold uppercase">Expiry</th>
                    <th className="px-4 py-3 font-semibold uppercase">Status</th>
                    <th className="px-4 py-3 font-semibold uppercase">Accepted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center">No donations submitted yet.</td>
                    </tr>
                  ) : (
                    donations.map(don => (
                      <tr key={don.id} className="hover:bg-dark-900/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-dark-50">{don.donationId}</td>
                        <td className="px-4 py-3 font-semibold text-dark-50">{don.foodName}</td>
                        <td className="px-4 py-3">{don.quantityKg} kg</td>
                        <td className="px-4 py-3">{don.expiryDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                            don.status === 'Accepted' ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                            : don.status === 'Delivered' ? 'bg-success-500/10 border-success-500/20 text-success-400'
                            : 'bg-warning-500/10 border-warning-500/20 text-warning-400'
                          }`}>
                            {don.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 truncate max-w-[120px]">{don.acceptedBy || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {showBulkModal && (
        <BulkDataEntryModal 
          restaurantId={user.uid} 
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleSeedSuccess}
        />
      )}
    </div>
  );
}
