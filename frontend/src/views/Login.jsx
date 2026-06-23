import React, { useState, useEffect } from 'react';
import { Heart, Mail, Lock, User, PlusCircle, ShieldAlert, MapPin, Layers, ArrowRight } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
};

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('restaurant');
  const [capacity, setCapacity] = useState(250);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [bgIndex, setBgIndex] = useState(0);
  const bgImages = [
    '/bg-images/media__1782240409060.jpg',
    '/bg-images/media__1782240426687.jpg',
    '/bg-images/media__1782240479762.jpg',
    '/bg-images/media__1782240519364.jpg',
    '/bg-images/media__1782240601185.jpg',
    '/bg-images/media__1782240819835.jpg',
    '/bg-images/media__1782240918210.jpg',
    '/bg-images/media__1782240918213.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register User
        let user;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            // If already registered, seamlessly log them in instead
            const loginCredential = await signInWithEmailAndPassword(auth, email, password);
            user = loginCredential.user;
          } else {
            throw err;
          }
        }
        
        // Save user details to Firestore, but timeout after 3s if Firestore isn't initialized
        try {
          await withTimeout(setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name || email.split('@')[0],
            email: email,
            phone: '',
            role: role,
            capacity: role === 'receiver' ? Number(capacity) : null,
            createdAt: serverTimestamp()
          }), 3000);
        } catch (dbErr) {
          console.warn("Firestore save skipped or timed out:", dbErr);
          // We silently swallow the error so the user isn't blocked by missing Firestore configuration
        }
        
        // Eagerly trigger login success so they don't wait for App.jsx onAuthStateChanged if it's slow
        if (onLoginSuccess) {
          onLoginSuccess({
            uid: user.uid,
            name: name || email.split('@')[0],
            email: email,
            role: role
          });
        }
      } else {
        // Login User
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Verify role before passing, with timeout to prevent hangs
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await withTimeout(getDoc(docRef), 3000);
          
          if (docSnap.exists() && docSnap.data().role !== role) {
            setErrorMsg(`Account exists but is registered as a ${docSnap.data().role}, not a ${role}.`);
            auth.signOut();
            return;
          }
          
          // Eagerly trigger login success
          if (onLoginSuccess) {
            onLoginSuccess({
              uid: user.uid,
              ...((docSnap.exists() ? docSnap.data() : { role, name: email.split('@')[0], email }))
            });
          }
        } catch (dbErr) {
          console.warn("Firestore check skipped or timed out:", dbErr);
          // Eager fallback
          if (onLoginSuccess) {
            onLoginSuccess({ uid: user.uid, role, name: email.split('@')[0], email });
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = async (demoRole) => {
    setErrorMsg('');
    setLoading(true);

    const demoCreds = {
      restaurant: {
        email: 'restaurant@sevam.ai',
        password: 'demo_password',
        name: 'The Golden Spoon Dining',
        role: 'restaurant',
        cuisineType: 'Multi-Cuisine Bistro'
      },
      distributor: {
        email: 'ngo@sevam.ai',
        password: 'demo_password',
        name: 'Feed The Need Foundation',
        role: 'distributor'
      },
      receiver: {
        email: 'receiver@sevam.ai',
        password: 'demo_password',
        name: 'Grace Orphanage Home',
        role: 'receiver',
        capacity: 350
      }
    }[demoRole];

    try {
      // 1. Try login
      try {
        await signInWithEmailAndPassword(auth, demoCreds.email, demoCreds.password);
        return; // App.jsx will automatically handle
      } catch (loginErr) {
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/invalid-login-credentials') {
          // 2. If fail (user not found), register
          const userCredential = await createUserWithEmailAndPassword(auth, demoCreds.email, demoCreds.password);
          const user = userCredential.user;
          
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: demoCreds.name,
            email: demoCreds.email,
            phone: '',
            role: demoCreds.role,
            capacity: demoCreds.capacity || null,
            createdAt: serverTimestamp()
          });
        } else {
          throw loginErr;
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Could not connect to Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'restaurant', label: 'Donor' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'receiver', label: 'Receiver' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-dark-950 font-sans">
      
      {/* Fallback Image Slideshow */}
      {bgImages.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === bgIndex ? 'opacity-100' : 'opacity-0'} z-0 contrast-[1.15] saturate-[1.3] brightness-105 sepia-[.1]`}
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      
      {/* Cinematic Video Background (If provided) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 mix-blend-overlay"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* Darkened Overlay for cinematic feel (Reduced by ~25% for better visibility) */}
      <div className="absolute inset-0 bg-dark-950/45 z-0" />
      
      {/* Visual Enhancements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-dark-950/10 via-transparent to-dark-950/75 z-0 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/30 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10 relative">
        
        {/* Left Side Info Panel */}
        <div className="lg:col-span-7 text-left flex flex-col justify-center">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-400 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-md">
              <Heart className="w-7 h-7 text-dark-50" />
            </div>
            <h1 
              className="font-extrabold text-5xl tracking-tight text-black"
              style={{ WebkitTextStroke: '2px #facc15' }}
            >
              SEVAM
            </h1>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-xl mb-6">
            Less Waste.<br />
            <span className="text-primary-400">More Impact.</span>
          </h2>

          <p className="text-xl md:text-2xl text-dark-200 font-medium drop-shadow-md mb-12">
            A smarter way to redistribute surplus food.
          </p>

          {/* Modern Demo Portal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleQuickAccess('restaurant')}
              className="p-5 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-1 backdrop-blur-md transition-all text-left group flex flex-col gap-4 shadow-xl"
            >
              <div className="p-3 bg-primary-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner">
                <Layers className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-wide">Donor</h4>
                <p className="text-xs text-dark-300 mt-1">Restaurant Panel</p>
              </div>
            </button>
            
            <button
              onClick={() => handleQuickAccess('distributor')}
              className="p-5 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-1 backdrop-blur-md transition-all text-left group flex flex-col gap-4 shadow-xl"
            >
              <div className="p-3 bg-success-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner">
                <MapPin className="w-6 h-6 text-success-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-wide">Distributor</h4>
                <p className="text-xs text-dark-300 mt-1">NGO Map</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickAccess('receiver')}
              className="p-5 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-1 backdrop-blur-md transition-all text-left group flex flex-col gap-4 shadow-xl"
            >
              <div className="p-3 bg-warning-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner">
                <Heart className="w-6 h-6 text-warning-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-wide">Receiver</h4>
                <p className="text-xs text-dark-300 mt-1">Shelter Node</p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side Glassmorphism Login Panel */}
        <div className="lg:col-span-4 lg:col-start-9 p-8 sm:p-10 rounded-[2rem] border border-white/10 bg-dark-950/50 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 to-primary-300" />
          
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-sm">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="text-sm text-dark-300">
              {isRegister ? 'Join the network and start making an impact.' : 'Sign in to access your portal.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 mb-6 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Select Role</label>
              <div className="grid grid-cols-3 gap-2 bg-dark-950/40 p-1.5 rounded-2xl border border-white/5">
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setRole(r.value);
                      if (!isRegister) {
                        handleQuickAccess(r.value);
                      }
                    }}
                    className={`py-2 rounded-xl text-[11px] font-bold transition-all capitalize ${
                      role === r.value 
                        ? 'bg-primary-500 text-dark-950 shadow-md' 
                        : 'text-dark-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {isRegister && (
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Organization Name"
                    className="w-full bg-dark-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all backdrop-blur-md"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-dark-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all backdrop-blur-md"
                />
              </div>
            </div>

            {isRegister && (
              <>

                {role === 'receiver' && (
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Daily Capacity</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder="e.g. 200"
                        className="w-full bg-dark-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all backdrop-blur-md"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-400 text-dark-950 font-extrabold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Deploy Node' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
            >
              {isRegister 
                ? 'Already a partner? Sign in instead.' 
                : 'Need to join the network? Register here.'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
