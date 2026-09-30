import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, MapPin, Fuel, DollarSign, Leaf, Activity,
  AlertTriangle, ArrowUpRight, TrendingDown,
  Atom, Sparkles, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell
} from 'recharts';
import { dashboardApi, alertsApi, tripsApi } from '../../services/api';
import type { DashboardSummary, Trip, Alert } from '../../types';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [fuelTrends, setFuelTrends] = useState<any[]>([]);
  const [emissions, setEmissions] = useState<any[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendsRes, emissRes, tripsRes, alertsRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getFuelTrends(trendDays),
        dashboardApi.getEmissions(),
        tripsApi.getTrips({ page: 1, page_size: 5 }),
        alertsApi.getAlerts({ page: 1, page_size: 4 }),
      ]);
      setSummary(sumRes.data);
      setFuelTrends(trendsRes.data.trends || []);
      setEmissions(emissRes.data.by_vehicle_type || []);
      setRecentTrips(tripsRes.data.data || []);
      setRecentAlerts(alertsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [trendDays]);

  const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#dc2626', '#8b5cf6'];

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading Fleet Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-gray-900">Fleet Operations & Sustainability Hub</h1>
          <p className="page-subtitle">Real-time quantum-optimized telemetry, fuel metrics, and emissions control</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboardData()}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
            title="Refresh"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link
            to="/optimization"
            className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5 shadow-sm"
          >
            <Atom size={16} />
            <span>QUBO Optimize</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles */}
        <div className="stat-card border-l-4 border-l-green-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Fleet</span>
            <div className="p-2 bg-green-50 rounded-lg text-green-700">
              <Truck size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{summary?.total_vehicles || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="text-green-700 font-semibold">{summary?.available_vehicles || 0} Available</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">{summary?.active_vehicles || 0} In Transit</span>
            </div>
          </div>
        </div>

        {/* Trips */}
        <div className="stat-card border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Trips</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <MapPin size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{summary?.total_trips || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="text-blue-700 font-semibold">{summary?.completed_trips || 0} Completed</span>
              <span>•</span>
              <span className="text-amber-700 font-semibold">{summary?.active_trips || 0} Active</span>
            </div>
          </div>
        </div>

        {/* Fuel & Efficiency */}
        <div className="stat-card border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fuel & Efficiency</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Fuel size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-bold text-gray-900">
                {(summary?.total_fuel_consumed || 0).toLocaleString()}
              </h3>
              <span className="text-xs text-gray-500 font-medium">Liters</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Avg Efficiency: <span className="font-semibold text-gray-800">{summary?.avg_efficiency_kmpl || 0} km/L</span>
            </p>
          </div>
        </div>

        {/* Total Cost & Emissions */}
        <div className="stat-card border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Carbon & Cost</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <Leaf size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-gray-500">₹</span>
              <h3 className="text-2xl font-bold text-gray-900">
                {(summary?.total_fuel_cost_inr || 0).toLocaleString()}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <TrendingDown size={14} className="text-green-600" />
              <span>CO₂: <strong className="text-gray-800">{(summary?.total_co2_emissions_kg || 0).toLocaleString()} kg</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuel Consumption Trend */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Fuel Consumption & Expenditure Trend</h3>
              <p className="text-xs text-gray-500">Daily fuel consumption volume vs fuel costs</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTrendDays(7)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${trendDays === 7 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                7D
              </button>
              <button
                onClick={() => setTrendDays(30)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${trendDays === 30 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                30D
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            {fuelTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => val.slice(5)}
                    stroke="#9ca3af"
                    fontSize={11}
                  />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs space-y-1">
                            <p className="font-bold text-gray-800">{data.date}</p>
                            <p className="text-green-700">Fuel: <strong>{data.fuel_liters?.toFixed(1)} L</strong></p>
                            <p className="text-blue-700">Cost: <strong>₹{data.cost_inr?.toLocaleString()}</strong></p>
                            <p className="text-gray-600">Trips: <strong>{data.trips}</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fuel_liters"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFuel)"
                    name="Fuel (Liters)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No telemetry recorded for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* Emissions by Vehicle Type */}
        <div className="card flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base">Carbon by Vehicle Type</h3>
            <p className="text-xs text-gray-500">Cumulative CO₂ (kg) per category</p>
          </div>

          <div className="h-64 w-full flex-1">
            {emissions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="vehicle_type" stroke="#9ca3af" fontSize={11} tickFormatter={(v) => v.toUpperCase()} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 border border-gray-100 shadow-lg rounded-lg text-xs">
                            <p className="font-bold text-gray-800 uppercase">{data.vehicle_type}</p>
                            <p className="text-emerald-700 font-semibold">{data.co2_kg?.toLocaleString()} kg CO₂</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="co2_kg" radius={[6, 6, 0, 0]}>
                    {emissions.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No emission data available
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Fleet Utilization: <strong className="text-gray-900">{summary?.vehicle_utilization_pct || 0}%</strong></span>
            <Link to="/emissions" className="text-green-700 hover:text-green-800 font-semibold flex items-center gap-1">
              <span>View Carbon Report</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/predict"
          className="p-4 bg-gradient-to-r from-emerald-800 to-green-700 rounded-xl text-white shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase tracking-wider text-green-200 font-semibold">AI Simulator</span>
            <h4 className="font-bold text-base mt-0.5">Predict Fuel Consumption</h4>
            <p className="text-xs text-green-100/80 mt-1">Simulate trip route, load, weather & traffic</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
            <Fuel size={22} className="text-white" />
          </div>
        </Link>

        <Link
          to="/optimization"
          className="p-4 bg-gradient-to-r from-indigo-900 to-blue-800 rounded-xl text-white shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">QUBO Solver</span>
            <h4 className="font-bold text-base mt-0.5">Quantum Fleet Optimizer</h4>
            <p className="text-xs text-blue-100/80 mt-1">Multi-objective vehicle-to-trip assignment</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
            <Atom size={22} className="text-white" />
          </div>
        </Link>

        <Link
          to="/assistant"
          className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-white shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">AI Assistant</span>
            <h4 className="font-bold text-base mt-0.5">Fleet Intelligence Agent</h4>
            <p className="text-xs text-gray-300 mt-1">Ask natural language questions on fuel & routes</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
            <Sparkles size={22} className="text-emerald-300" />
          </div>
        </Link>
      </div>

      {/* Lower Section: Recent Trips & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips Table */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Recent Fleet Trips</h3>
              <p className="text-xs text-gray-500">Live operational log and trip outcomes</p>
            </div>
            <Link to="/trips" className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1">
              <span>View All Trips</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Trip Code</th>
                  <th className="table-th">Route</th>
                  <th className="table-th">Distance</th>
                  <th className="table-th">Fuel / Cost</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTrips.map((trip) => (
                  <tr key={trip.id} className="table-row">
                    <td className="table-td font-semibold text-gray-900">{trip.trip_code}</td>
                    <td className="table-td text-gray-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{trip.origin}</span>
                        <span className="text-gray-400">→</span>
                        <span>{trip.destination}</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-600">{trip.distance_km} km</td>
                    <td className="table-td">
                      <div className="text-xs">
                        <p className="font-medium text-gray-900">{trip.actual_fuel_liters ? `${trip.actual_fuel_liters} L` : '-'}</p>
                        <p className="text-gray-500">{trip.fuel_cost_inr ? `₹${trip.fuel_cost_inr.toLocaleString()}` : '-'}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={
                        trip.status === 'completed'
                          ? 'badge-success'
                          : trip.status === 'active'
                          ? 'badge-info'
                          : 'badge-neutral'
                      }>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alerts */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Fleet Alerts</h3>
              <p className="text-xs text-gray-500">Critical notifications & warnings</p>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-green-700 hover:text-green-800">
              View All ({summary?.active_alerts || 0})
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50/60 border-red-200/80 text-red-800'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/60 border-amber-200/80 text-amber-800'
                      : 'bg-blue-50/60 border-blue-200/80 text-blue-800'
                  }`}
                >
                  <AlertTriangle
                    size={16}
                    className={`flex-shrink-0 mt-0.5 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : alert.severity === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{alert.message}</p>
                    <p className="text-[10px] opacity-75 mt-1">
                      {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No active alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
