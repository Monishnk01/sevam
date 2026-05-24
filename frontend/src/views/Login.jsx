import React, { useState } from 'react';
import { Heart, Mail, Lock, User, PlusCircle, ShieldAlert, Sparkles, MapPin, Layers } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('restaurant');
  const [cuisineType, setCuisineType] = useState('Indian/Asian');
  const [capacity, setCapacity] = useState(250);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const payload = isRegister 
      ? { email, password, name, role, cuisine_type: cuisineType, capacity: Number(capacity) }
      : { email, password };

    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Verification failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to the backend server. Make sure server.js is running.');
    } finally {
      setLoading(false);
    }
  };

  // Flawless Quick Access: Attempts login. If user doesn't exist, auto-registers then logs in.
  const handleQuickAccess = async (demoRole) => {
    setErrorMsg('');
    setLoading(true);

    const demoCreds = {
      restaurant: {
        email: 'restaurant@upahar.ai',
        password: 'demo_password',
        name: 'The Golden Spoon Dining',
        role: 'restaurant',
        cuisine_type: 'Multi-Cuisine Bistro'
      },
      distributor: {
        email: 'ngo@upahar.ai',
        password: 'demo_password',
        name: 'Feed The Need Foundation',
        role: 'distributor'
      },
      receiver: {
        email: 'receiver@upahar.ai',
        password: 'demo_password',
        name: 'Grace Orphanage Home',
        role: 'receiver',
        capacity: 350
      }
    }[demoRole];

    try {
      // 1. Try login
      let res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoCreds.email, password: demoCreds.password })
      });
      let data = await res.json();

      if (data.success) {
        onLoginSuccess(data.user);
        return;
      }

      // 2. If fail (user not found), register then login
      res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoCreds.email,
          password: demoCreds.password,
          name: demoCreds.name,
          role: demoCreds.role,
          cuisine_type: demoCreds.cuisine_type,
          capacity: demoCreds.capacity
        })
      });
      data = await res.json();

      if (data.success) {
        // Log in with the newly registered credentials
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Failed to auto-provision demo account.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to the backend server. Make sure backend is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-dark-950">
      
      {/* Visual Backdrops */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-success-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side Info Panel */}
        <div className="lg:col-span-6 text-left flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-success-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-wide bg-gradient-to-r from-white via-dark-100 to-primary-400 bg-clip-text text-transparent">UPAHAR</h1>
              <p className="text-[10px] text-primary-400 font-mono tracking-widest uppercase">Autonomous Food Redistribution Agent</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Turn Surplus Food into <span className="text-success-400 underline decoration-success-500/40 decoration-wavy">Social Impact</span> Using AI.
          </h2>

          <p className="text-sm text-dark-400 leading-relaxed max-w-[460px]">
            Upahar leverages personalized Random Forest regressors to predict food leftovers in restaurants. It dynamically matches surpluses, notifies distributors, and feeds receivers autonomously.
          </p>

          {/* Quick Demo provisioner */}
          <div className="p-5 rounded-2xl border border-dark-800 bg-dark-900/20 backdrop-blur-sm mt-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-warning-400" />
              1-Click Demo Portal
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickAccess('restaurant')}
                className="py-2.5 px-2 rounded-xl border border-primary-500/20 bg-primary-500/5 hover:bg-primary-500/10 text-[10px] text-primary-300 font-bold transition-all text-center leading-tight flex flex-col items-center gap-1"
              >
                <span>Restaurant</span>
                <span className="text-[8px] text-primary-500 font-normal">Donor Panel</span>
              </button>
              
              <button
                onClick={() => handleQuickAccess('distributor')}
                className="py-2.5 px-2 rounded-xl border border-success-500/20 bg-success-500/5 hover:bg-success-500/10 text-[10px] text-success-300 font-bold transition-all text-center leading-tight flex flex-col items-center gap-1"
              >
                <span>NGO Partner</span>
                <span className="text-[8px] text-success-500 font-normal">Distributor Map</span>
              </button>

              <button
                onClick={() => handleQuickAccess('receiver')}
                className="py-2.5 px-2 rounded-xl border border-warning-500/20 bg-warning-500/5 hover:bg-warning-500/10 text-[10px] text-warning-300 font-bold transition-all text-center leading-tight flex flex-col items-center gap-1"
              >
                <span>Shelter Bank</span>
                <span className="text-[8px] text-warning-500 font-normal">Receiver Node</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Register/Login Form */}
        <div className="lg:col-span-6 p-8 rounded-3xl glass-card border border-dark-800">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-1.5">
              {isRegister ? 'Create Partner Profile' : 'Partner Sign In'}
            </h3>
            <p className="text-xs text-dark-400">
              {isRegister ? 'Register your node to join the redistribution network' : 'Access your role-specific AI management systems'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-dark-400 uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Restaurant or NGO Name"
                    className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-dark-400 uppercase">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-bold text-dark-400 uppercase">System Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['restaurant', 'distributor', 'receiver'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all capitalize ${
                          role === r 
                            ? 'bg-primary-500/10 border-primary-500 text-primary-400' 
                            : 'bg-dark-900 border-dark-800 text-dark-400 hover:border-dark-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {role === 'restaurant' && (
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[10px] font-bold text-dark-400 uppercase">Cuisine Type</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="text"
                        value={cuisineType}
                        onChange={(e) => setCuisineType(e.target.value)}
                        placeholder="e.g. Italian, Buffet, Fast Food"
                        className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}

                {role === 'receiver' && (
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[10px] font-bold text-dark-400 uppercase">Daily Shelter Capacity (Meals)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder="e.g. 200"
                        className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-primary-600 to-success-600 text-white font-bold text-xs hover:from-primary-500 hover:to-success-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10"
            >
              {loading ? (
                <span>Verifying Node...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>{isRegister ? 'Deploy Profile Node' : 'Enter Control Panel'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Screen Option */}
          <div className="mt-5 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[10px] font-semibold text-primary-400 hover:underline"
            >
              {isRegister 
                ? 'Already registered? Sign in to your dashboard' 
                : 'Need a new network registration? Create a partner node'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
