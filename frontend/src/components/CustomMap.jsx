import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Home, Shield, RefreshCw } from 'lucide-react';

export default function CustomMap({ restaurants = [], receivers = [], activeDonations = [] }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pulseScale, setPulseScale] = useState(1);

  // Simple pulsing effect for active nodes
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.4 : 1));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Map limits mapping latitude and longitude to a 100x100 relative viewbox
  // Default bounds for Bangalore (12.94 to 13.00 N, 77.56 to 77.63 E)
  const latMin = 12.94;
  const latMax = 13.00;
  const lngMin = 77.56;
  const lngMax = 77.63;

  const getRelativeCoords = (lat, lng) => {
    // If invalid coords, generate mock offset
    const latitude = lat || 12.9716;
    const longitude = lng || 77.5946;

    const x = ((longitude - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - ((latitude - latMin) / (latMax - latMin)) * 100; // Invert Y for screen coords

    // Clip bounds
    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y))
    };
  };

  return (
    <div className="relative w-full h-[400px] rounded-2xl glass-card overflow-hidden border border-dark-800">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      {/* Radar scanning animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary-500/10 pointer-events-none">
        <div className="w-full h-full rounded-full border border-primary-500/5 animate-ping opacity-25" />
        <div className="absolute inset-0 w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_50%,rgba(139,92,246,0.08))] animate-spin-slow" />
      </div>

      {/* SVG Canvas */}
      <svg className="absolute inset-0 w-full h-full select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        
        {/* Render active delivery route paths */}
        {activeDonations
          .filter((don) => don.status === 'assigned' || don.status === 'picked_up')
          .map((don) => {
            const rest = restaurants.find((r) => r.id === don.restaurant_id);
            // Default link to a random receiver if not fully assigned to draw a line
            const recv = receivers[0]; 

            if (!rest || !recv) return null;

            const start = getRelativeCoords(rest.latitude, rest.longitude);
            const end = getRelativeCoords(recv.latitude, recv.longitude);

            return (
              <g key={`route-${don.id}`}>
                {/* Static connection path */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(139, 92, 246, 0.2)"
                  strokeWidth="0.6"
                  strokeDasharray="1.5,1"
                />
                
                {/* Moving cargo dash representing live redistribution */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#a78bfa"
                  strokeWidth="0.8"
                  strokeDasharray="2, 8"
                  strokeDashoffset="10"
                  className="animate-[dash_3s_linear_infinite]"
                  style={{
                    animation: 'dash 4s linear infinite'
                  }}
                />
              </g>
            );
          })}

        {/* Render Receiver Nodes */}
        {receivers.map((recv) => {
          const coords = getRelativeCoords(recv.latitude, recv.longitude);
          const isHovered = hoveredNode && hoveredNode.id === recv.id;
          
          return (
            <g
              key={recv.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode({ ...recv, type: 'receiver' })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer pulsing halo */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r="3.5"
                fill="rgba(34, 197, 94, 0.15)"
                className="transition-transform duration-300 ease-out"
                style={{
                  transform: isHovered ? 'scale(1.4)' : `scale(${pulseScale})`,
                  transformOrigin: `${coords.x}% ${coords.y}%`
                }}
              />
              <circle
                cx={coords.x}
                cy={coords.y}
                r="1.8"
                fill="#22c55e"
                stroke="#15803d"
                strokeWidth="0.3"
              />
            </g>
          );
        })}

        {/* Render Restaurant Nodes */}
        {restaurants.map((rest) => {
          const coords = getRelativeCoords(rest.latitude, rest.longitude);
          const hasActiveDonation = activeDonations.some(
            (don) => don.restaurant_id === rest.id && don.status === 'pending'
          );
          const isHovered = hoveredNode && hoveredNode.id === rest.id;

          return (
            <g
              key={rest.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode({ ...rest, type: 'restaurant', hasActiveDonation })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer glowing warning halo for surplus food available */}
              {hasActiveDonation && (
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="4"
                  fill="rgba(245, 158, 11, 0.2)"
                  className="transition-transform duration-300"
                  style={{
                    transform: `scale(${pulseScale})`,
                    transformOrigin: `${coords.x}% ${coords.y}%`
                  }}
                />
              )}
              <circle
                cx={coords.x}
                cy={coords.y}
                r="1.8"
                fill={hasActiveDonation ? '#f59e0b' : '#8b5cf6'}
                stroke={hasActiveDonation ? '#b45309' : '#6d28d9'}
                strokeWidth="0.3"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Info Tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 p-4 rounded-xl glass-card border border-dark-700 max-w-[260px] animate-fade-in pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5">
            {hoveredNode.type === 'restaurant' ? (
              <MapPin className={`w-4 h-4 ${hoveredNode.hasActiveDonation ? 'text-amber-500' : 'text-primary-400'}`} />
            ) : (
              <Home className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-bold text-sm text-white truncate">{hoveredNode.name}</span>
          </div>
          <p className="text-xs text-dark-400 mb-2 truncate">{hoveredNode.address}</p>
          
          <div className="border-t border-dark-800 pt-2 flex items-center justify-between text-[10px]">
            {hoveredNode.type === 'restaurant' ? (
              <>
                <span className="text-dark-400">{hoveredNode.cuisine_type || 'Premium Dining'}</span>
                {hoveredNode.hasActiveDonation ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Surplus Available
                  </span>
                ) : (
                  <span className="text-dark-500">No surplus</span>
                )}
              </>
            ) : (
              <>
                <span className="text-dark-400">Shelter Capacity</span>
                <span className="font-semibold text-emerald-400">
                  {Math.round(hoveredNode.capacity_used)} / {hoveredNode.capacity} meals
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compass Legent Grid */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 p-3 rounded-xl glass-card border border-dark-800 text-[10px] text-dark-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 border border-primary-700" />
          <span>Restaurant (Food Donor)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-700 animate-pulse" />
          <span>Surplus Predicted / Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-success-500 border border-success-700" />
          <span>NGO / Shelter Receiver</span>
        </div>
      </div>

      {/* Pulsing indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-900/60 border border-dark-800 text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-dark-400 font-mono tracking-wider">RADAR ONLINE</span>
      </div>
    </div>
  );
}
