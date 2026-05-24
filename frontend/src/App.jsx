import React, { useState, useEffect } from 'react';
import Login from './views/Login';
import DashboardLayout from './components/DashboardLayout';
import RestaurantDashboard from './views/RestaurantDashboard';
import NGODashboard from './views/NGODashboard';
import ReceiverDashboard from './views/ReceiverDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    mealsSaved: 0,
    wasteReduced: '0 kg',
    predictionAccuracy: '95%'
  });

  const API_URL = 'http://localhost:5000/api';
  const WS_URL = 'ws://localhost:5000';

  // WebSocket connection effect
  useEffect(() => {
    if (!user) return;

    console.log('Connecting to Upahar WebSocket server...');
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('WebSocket alert received:', payload);
        
        if (payload.type && payload.message) {
          // Add notification to list
          const newNotif = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: payload.type,
            message: payload.message,
            timestamp: new Date().toISOString()
          };
          setNotifications((prev) => [newNotif, ...prev]);

          // Browser Notification alert
          if (Notification.permission === 'granted') {
            new Notification('Upahar Agent Update', {
              body: payload.message,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onerror = (err) => console.error('WebSocket connection error:', err);
    ws.onclose = () => console.log('WebSocket connection closed.');

    // Request desktop permission on socket launch
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      ws.close();
    };
  }, [user]);

  // Dynamic statistics sync
  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    // Choose correct profile target ID
    const targetId = user.role === 'distributor' ? user.id : user.profileId;
    if (!targetId) return;

    try {
      const res = await fetch(`${API_URL}/stats/${user.role}/${targetId}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading analytics statistics:', err);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
    setStats({
      mealsSaved: 0,
      wasteReduced: '0 kg',
      predictionAccuracy: '95%'
    });
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  };

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
      fetchStats={fetchStats}
    >
      {user.role === 'restaurant' && (
        <RestaurantDashboard user={user} notifications={notifications} />
      )}
      {user.role === 'distributor' && (
        <NGODashboard user={user} notifications={notifications} />
      )}
      {user.role === 'receiver' && (
        <ReceiverDashboard user={user} notifications={notifications} />
      )}
    </DashboardLayout>
  );
}
