import React, { useState, useEffect } from 'react';
import {
  MapPin, Navigation, Truck, Fuel, Leaf, ArrowRight,
  Info, Compass, Activity, Layers
} from 'lucide-react';
import { tripsApi, vehiclesApi } from '../../services/api';
import type { Trip, Vehicle } from '../../types';

// City coordinates across India
const CITY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  Mumbai: { lat: 19.076, lng: 72.8777, name: 'Mumbai' },
  Delhi: { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
  Bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
  Chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
  Hyderabad: { lat: 17.385, lng: 78.4867, name: 'Hyderabad' },
  Pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
  Kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  Jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
  Lucknow: { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
  Kanpur: { lat: 26.4499, lng: 80.3319, name: 'Kanpur' },
  Nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },
  Raipur: { lat: 21.2514, lng: 81.6296, name: 'Raipur' },
  Indore: { lat: 22.7196, lng: 75.8577, name: 'Indore' },
  Bhopal: { lat: 23.2599, lng: 77.4126, name: 'Bhopal' },
  Agra: { lat: 27.1767, lng: 78.0081, name: 'Agra' },
  Chandigarh: { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  Udaipur: { lat: 24.5854, lng: 73.7125, name: 'Udaipur' },
  Vadodara: { lat: 22.3072, lng: 73.1812, name: 'Vadodara' },
  Surat: { lat: 21.1702, lng: 72.8311, name: 'Surat' },
  Coimbatore: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' },
  Bhubaneswar: { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar' },
  Nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik' },
};

export default function RouteMapPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, vRes] = await Promise.all([
          tripsApi.getTrips({ page_size: 40 }),
          vehiclesApi.getVehicles({ page_size: 50 }),
        ]);
        setTrips(tRes.data.data);
        setVehicles(vRes.data.data);
        if (tRes.data.data.length > 0) {
          setSelectedTrip(tRes.data.data[0]);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Map projection helper (India bounds: lat 8-36, lng 68-96)
  const project = (lat: number, lng: number) => {
    const minLat = 8;
    const maxLat = 35;
    const minLng = 68;
    const maxLng = 92;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const assignedVehicle = selectedTrip ? vehicles.find((v) => v.id === selectedTrip.vehicle_id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">National Fleet Route Radar & Telemetry</h1>
          <p className="page-subtitle">Interactive corridor map visualizing freight movements, green corridors, and active missions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 card p-0 overflow-hidden flex flex-col bg-slate-900 text-white min-h-[560px] relative">
          {/* Map Top Bar */}
          <div className="p-4 bg-slate-950/70 backdrop-blur border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Compass className="text-green-400" size={16} />
              <span className="font-bold tracking-wider text-slate-200 uppercase">India National Transit Corridors</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse" /> Active Transit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Planned
              </span>
            </div>
          </div>

          {/* SVG Map Projection Area */}
          <div className="flex-1 relative flex items-center justify-center p-6">
            {/* Ambient Map Grid */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]" />

            <svg viewBox="0 0 100 100" className="w-full h-full max-h-[500px]">
              {/* Trip Route Lines */}
              {trips.map((t) => {
                const c1 = CITY_COORDS[t.origin];
                const c2 = CITY_COORDS[t.destination];
                if (!c1 || !c2) return null;
                const p1 = project(c1.lat, c1.lng);
                const p2 = project(c2.lat, c2.lng);
                const isSelected = selectedTrip?.id === t.id;

                return (
                  <g key={t.id} onClick={() => setSelectedTrip(t)} className="cursor-pointer group">
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={
                        isSelected
                          ? '#22c55e'
                          : t.status === 'completed'
                          ? '#10b981'
                          : t.status === 'active'
                          ? '#3b82f6'
                          : '#64748b'
                      }
                      strokeWidth={isSelected ? 1.4 : 0.6}
                      strokeDasharray={t.status === 'planned' ? '1,1' : 'none'}
                      opacity={isSelected ? 1 : 0.45}
                      className="transition-all"
                    />
                  </g>
                );
              })}

              {/* City Nodes */}
              {Object.entries(CITY_COORDS).map(([cityName, coord]) => {
                const p = project(coord.lat, coord.lng);
                const isOrigin = selectedTrip?.origin === cityName;
                const isDest = selectedTrip?.destination === cityName;
                const isHighlighted = isOrigin || isDest;

                return (
                  <g key={cityName} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHighlighted ? 2.2 : 1.0}
                      fill={isOrigin ? '#22c55e' : isDest ? '#3b82f6' : '#94a3b8'}
                      stroke="#0f172a"
                      strokeWidth={0.5}
                    />
                    <text
                      x={p.x + 1.8}
                      y={p.y + 0.8}
                      fill={isHighlighted ? '#ffffff' : '#64748b'}
                      fontSize={isHighlighted ? 2.6 : 1.9}
                      fontWeight={isHighlighted ? 'bold' : 'normal'}
                      fontFamily="sans-serif"
                    >
                      {cityName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Click any transit corridor or city node to inspect telemetry</span>
            <span>Total Logged Corridors: {trips.length}</span>
          </div>
        </div>

        {/* Selected Route Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedTrip ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">Trip Telemetry</span>
                  <h3 className="font-bold text-gray-900 text-lg font-mono">{selectedTrip.trip_code}</h3>
                </div>
                <span className={
                  selectedTrip.status === 'completed'
                    ? 'badge-success'
                    : selectedTrip.status === 'active'
                    ? 'badge-info'
                    : 'badge-neutral'
                }>
                  {selectedTrip.status}
                </span>
              </div>

              {/* Corridor Route */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                    <MapPin size={16} className="text-green-700" />
                    <span>{selectedTrip.origin}</span>
                  </div>
                  <ArrowRight size={14} className="text-gray-400" />
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                    <MapPin size={16} className="text-blue-700" />
                    <span>{selectedTrip.destination}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>Distance: <strong className="text-gray-800">{selectedTrip.distance_km} km</strong></span>
                  <span className="capitalize">{selectedTrip.road_type} • {selectedTrip.traffic_condition}</span>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-gray-400 text-[11px]">Assigned Asset</h4>
                {assignedVehicle ? (
                  <div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{assignedVehicle.registration_number}</span>
                      <span className="text-[11px] uppercase badge-neutral">{assignedVehicle.vehicle_type}</span>
                    </div>
                    <p className="text-gray-500">
                      {assignedVehicle.manufacturer} {assignedVehicle.model} ({assignedVehicle.fuel_type})
                    </p>
                    <p className="text-green-800 font-semibold">
                      Efficiency Baseline: {assignedVehicle.baseline_mileage_kmpl} km/L
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-400 italic">No assigned vehicle</div>
                )}
              </div>

              {/* Fuel & Emissions Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-green-50/70 rounded-xl border border-green-100">
                  <span className="text-[11px] text-green-800 font-medium">Fuel Burn</span>
                  <p className="text-lg font-black text-gray-900 mt-0.5">
                    {selectedTrip.actual_fuel_liters || selectedTrip.expected_fuel_liters || 0} L
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-800 font-medium">CO₂ Output</span>
                  <p className="text-lg font-black text-emerald-950 mt-0.5">
                    {selectedTrip.co2_emissions_kg || 0} kg
                  </p>
                </div>
              </div>

              {/* Corridor List Quick Selector */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold uppercase tracking-wider text-gray-400 text-[11px] mb-2">Recent Corridors</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {trips.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrip(t)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        selectedTrip.id === t.id ? 'bg-green-50 font-bold text-green-900 border border-green-200' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{t.origin} → {t.destination}</span>
                      <span className="font-mono text-gray-400">{t.distance_km} km</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center p-8 text-sm text-gray-400">
              Select a transit route from the map
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
