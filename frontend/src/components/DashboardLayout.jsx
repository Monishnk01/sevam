import React, { useEffect, useState } from 'react';
import { 
  LogOut, 
  Bell, 
  Map, 
  TrendingUp, 
  Heart, 
  User, 
  Activity,
  AlertCircle,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  Truck
} from 'lucide-react';

export default function DashboardLayout({ user, onLogout, children, notifications, addNotification, stats, fetchStats }) {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Auto-refresh stats when notification arrives
  useEffect(() => {
    if (fetchStats) {
      fetchStats();
    }
  }, [notifications]);

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-dark-900/40 border-r border-dark-800 flex flex-col justify-between p-6">
        <div>
          {/* Brand/Logo Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-success-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Heart className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-dark-100 to-primary-400 bg-clip-text text-transparent">UPAHAR AI</h1>
              <p className="text-[10px] text-dark-500 font-mono tracking-widest">AUTONOMOUS REDIST</p>
            </div>
          </div>

          {/* User Profile Badge */}
          <div className="p-4 rounded-2xl glass-card border border-dark-800/80 mb-6">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-950 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <p className="text-[9px] text-dark-400 truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary-500/10 text-primary-400 border border-primary-500/25 text-[9px] font-semibold w-max capitalize">
              <ShieldCheck className="w-3 h-3" />
              <span>{user.role} Partner</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-semibold">
              <Activity className="w-4 h-4" />
              <span>Dashboard Core</span>
            </div>
            
            <div className="text-[10px] text-dark-500 font-mono uppercase tracking-wider px-4 mt-4 mb-2">
              System Stats
            </div>
            
            <div className="flex flex-col gap-3 px-4 py-3 rounded-xl border border-dark-800/50 bg-dark-900/20 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Meals Saved:</span>
                <span className="font-bold text-success-400 font-mono">{stats.mealsSaved || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Waste Prevented:</span>
                <span className="font-bold text-primary-400 font-mono">{stats.wasteReduced || '0 kg'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">AI Accuracy:</span>
                <span className="font-bold text-warning-400 font-mono">{stats.predictionAccuracy || '95%'}</span>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer actions */}
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-danger-500/20 bg-danger-500/5 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500/30 transition-all text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-dark-800 px-8 flex items-center justify-between bg-dark-950/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              {user.role} Operations Control
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            <span className="text-[10px] text-dark-400 font-mono">Agent Active</span>
          </div>

          <div className="flex items-center gap-4 relative">
            
            {/* Live Alerts Notification Center Trigger */}
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="relative p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:text-white hover:border-dark-700 transition-all"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-danger-500 border border-dark-950 animate-bounce" />
              )}
            </button>

            {/* Notification Drawer Dropdown */}
            {showNotificationCenter && (
              <div className="absolute right-0 top-12 w-96 rounded-2xl glass-card border border-dark-700 p-4 shadow-2xl z-50 max-h-[420px] overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between border-b border-dark-800 pb-3 mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-primary-400" />
                    Agent Active Logs
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-800 text-dark-400 font-mono">
                    {notifications.length} alerts
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-dark-500">
                      No notifications logged yet. Try triggering predictions or pickups!
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      // Style matching the message type
                      const isAgent = notif.type === 'AUTONOMOUS_DONATION';
                      const isTrain = notif.type === 'MODEL_TRAINED';
                      const isDelivered = notif.type === 'DONATION_DELIVERED';
                      
                      return (
                        <div 
                          key={notif.id}
                          className={`p-3 rounded-xl border text-[11px] flex gap-2.5 transition-all ${
                            isAgent 
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' 
                              : isTrain 
                              ? 'bg-primary-500/5 border-primary-500/20 text-primary-300'
                              : isDelivered
                              ? 'bg-success-500/5 border-success-500/20 text-success-300'
                              : 'bg-dark-900 border-dark-800 text-dark-300'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isAgent && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                            {isTrain && <TrendingUp className="w-3.5 h-3.5 text-primary-400" />}
                            {isDelivered && <CheckCircle className="w-3.5 h-3.5 text-success-400" />}
                            {!isAgent && !isTrain && !isDelivered && <Truck className="w-3.5 h-3.5 text-dark-400" />}
                          </div>
                          <div>
                            <p className="font-semibold leading-relaxed">{notif.message}</p>
                            <span className="text-[8px] text-dark-500 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Profile Avatar indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-[10px] text-dark-400 font-mono">NODE_ONLINE</span>
            </div>

          </div>
        </header>

        {/* Dynamic child view scrollable pane */}
        <section className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </section>

      </main>
    </div>
  );
}
