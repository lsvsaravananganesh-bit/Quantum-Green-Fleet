import React, { useState, useEffect } from 'react';
import {
  Route, Truck, Clock, AlertTriangle, CheckCircle, Play,
  RefreshCw, MapPin, Gauge, Fuel, ArrowRight, ShieldCheck
} from 'lucide-react';
import { vrpApi } from '../../services/api';

export default function VRPPage() {
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  const [algorithm, setAlgorithm] = useState<string>('clarke_wright_2opt');
  const [solution, setSolution] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      const res = await vrpApi.getDemoData();
      setDemoData(res.data);
      // Automatically solve with default heuristic
      const solRes = await vrpApi.solveVRP({
        algorithm: 'clarke_wright_2opt',
        depot: res.data.depot,
        stops: res.data.stops,
        vehicles: res.data.vehicles,
      });
      setSolution(solRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to initialize VRP dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolve = async () => {
    if (!demoData) return;
    try {
      setLoading(true);
      setError(null);
      const res = await vrpApi.solveVRP({
        algorithm,
        depot: demoData.depot,
        stops: demoData.stops,
        vehicles: demoData.vehicles,
      });
      setSolution(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to solve VRP instance.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hr: number) => {
    const hours = Math.floor(hr);
    const mins = Math.round((hr - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 1: Logistics Engine
            </span>
            <span className="text-xs text-gray-500">CVRPTW Formulation</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Multi-Stop Vehicle Routing Optimization</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Capacitated multi-vehicle routing with delivery time windows, dynamic service durations, and emissions awareness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="clarke_wright_2opt">Clarke-Wright Savings + 2-Opt (Scalable)</option>
            <option value="qubo_vrp">Quantum-Inspired Simulated Annealing (QUBO)</option>
          </select>

          <button
            onClick={handleSolve}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            <span>Run VRP Optimizer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      {solution && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Distance</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{solution.total_distance_km} km</p>
            <span className="text-[11px] text-emerald-600 font-medium">All vehicle tours</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Predicted Fuel</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{solution.total_fuel_liters} L</p>
            <span className="text-[11px] text-emerald-600 font-medium">Payload adjusted</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">CO2 Footprint</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{solution.total_co2_kg} kg</p>
            <span className="text-[11px] text-emerald-600 font-medium">Scope 1 footprint</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Operating Cost</p>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{solution.total_cost_inr.toLocaleString()}</p>
            <span className="text-[11px] text-gray-500 font-medium">Energy expenditure</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Tour Duration</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{solution.total_time_hr} hrs</p>
            <span className="text-[11px] text-gray-500 font-medium">Max vehicle shift</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Feasibility</p>
            <div className="flex items-center gap-1.5 mt-1">
              {solution.is_feasible ? (
                <>
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">100% Feasible</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-amber-600" />
                  <span className="text-sm font-bold text-amber-700">Penalized</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">{solution.computation_time_ms} ms runtime</span>
          </div>
        </div>
      )}

      {/* Network Overview & Stop Status */}
      {demoData && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-emerald-700" />
              <h3 className="text-sm font-bold text-gray-800">Dispatch Depot & Planned Stops ({demoData.stops.length})</h3>
            </div>
            <span className="text-xs text-gray-500">Hub: {demoData.depot.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {demoData.stops.map((s: any) => (
              <div key={s.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 truncate">{s.name}</span>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded text-[10px]">
                    {s.demand_kg} kg
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 pt-1">
                  <span>Window: {formatTime(s.time_window_start)} - {formatTime(s.time_window_end)}</span>
                  <span>Duration: {s.service_duration_min}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Routes Details */}
      {solution && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Route size={18} className="text-emerald-700" />
            <span>Optimized Vehicle Tour Schedules ({solution.routes.length})</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {solution.routes.map((route: any) => (
              <div key={route.vehicle_id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                {/* Route Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                      <Truck size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{route.registration_number}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium capitalize">
                          {route.vehicle_type} ({route.fuel_type})
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {route.stops.length - 2} stops delivered | {route.total_distance_km} km | {route.total_duration_hr} hrs
                      </p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="w-48 text-right">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Capacity Load</span>
                      <span className="font-bold text-gray-800">{route.capacity_utilized_kg} / {route.capacity_max_kg} kg</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          route.utilization_pct > 90 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(route.utilization_pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stop Sequence Timeline */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Location Node</th>
                        <th className="py-2.5 px-3">Arrival</th>
                        <th className="py-2.5 px-3">Departure</th>
                        <th className="py-2.5 px-3">Leg Dist</th>
                        <th className="py-2.5 px-3">Drop (kg)</th>
                        <th className="py-2.5 px-3">Remaining (kg)</th>
                        <th className="py-2.5 px-3">Punctuality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {route.stops.map((stop: any, sIdx: number) => (
                        <tr key={sIdx} className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-3 font-medium text-gray-500">{stop.stop_index}</td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{stop.location_name}</td>
                          <td className="py-2.5 px-3 font-mono">{formatTime(stop.arrival_time_hr)}</td>
                          <td className="py-2.5 px-3 font-mono">{formatTime(stop.departure_time_hr)}</td>
                          <td className="py-2.5 px-3">{stop.distance_from_prev_km} km</td>
                          <td className="py-2.5 px-3 font-medium text-emerald-700">
                            {stop.demand_delivered_kg > 0 ? `-${stop.demand_delivered_kg}` : '—'}
                          </td>
                          <td className="py-2.5 px-3">{stop.payload_on_arrival_kg} kg</td>
                          <td className="py-2.5 px-3">
                            {stop.time_window_status === 'on_time' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                Punctual
                              </span>
                            )}
                            {stop.time_window_status === 'early_waited' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                                Waited {stop.wait_time_min}m
                              </span>
                            )}
                            {stop.time_window_status === 'late' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                                Late {stop.late_time_min}m
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Route Metrics Footer */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-gray-500 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <span>Estimated Fuel: <strong className="text-gray-800">{route.total_fuel_liters} L</strong></span>
                    <span>CO2 Emissions: <strong className="text-emerald-700">{route.total_co2_kg} kg</strong></span>
                    <span>Route Cost: <strong className="text-gray-800">₹{route.total_cost_inr}</strong></span>
                  </div>
                  {route.violations.length > 0 && (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {route.violations[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
