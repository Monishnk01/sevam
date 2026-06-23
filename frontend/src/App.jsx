import React, { useState, useEffect } from 'react';
import Login from './views/Login';
import DashboardLayout from './components/DashboardLayout';
import RestaurantDashboard from './views/RestaurantDashboard';
import NGODashboard from './views/NGODashboard';
import ReceiverDashboard from './views/ReceiverDashboard';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    mealsSaved: 0,
    wasteReduced: '0 kg',
    predictionAccuracy: '95%'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fallback timeout: if Firestore takes longer than 5 seconds, drop to login screen
        const fallbackTimer = setTimeout(() => {
          console.warn("Firestore took too long to respond. Falling back.");
          setLoading(false);
        }, 5000);

        try {
          // Fetch additional user info from Firestore
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUser({
              uid: firebaseUser.uid,
              ...docSnap.data()
            });
          } else {
            console.error('No user profile found in Firestore');
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        } finally {
          clearTimeout(fallbackTimer);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    // Rely on onAuthStateChanged to handle state updates
    // But we can eagerly set it if needed
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setNotifications([]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-primary-400 font-bold animate-pulse">Initializing Firebase Auth...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      notifications={notifications}
      addNotification={addNotification}
      stats={stats}
      fetchStats={() => {}}
    >
      {user.role === 'restaurant' && (
        <RestaurantDashboard user={user} notifications={notifications} addNotification={addNotification} />
      )}
      {user.role === 'distributor' && (
        <NGODashboard user={user} notifications={notifications} addNotification={addNotification} />
      )}
      {user.role === 'receiver' && (
        <ReceiverDashboard user={user} notifications={notifications} addNotification={addNotification} />
      )}
    </DashboardLayout>
  );
}
