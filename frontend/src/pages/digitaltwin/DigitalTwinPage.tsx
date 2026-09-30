import React, { useState, useEffect } from 'react';
import {
  Cpu, Play, RefreshCw, AlertTriangle, CloudRain, Sun,
  TrendingDown, CheckCircle, ShieldAlert, Zap, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { digitalTwinApi } from '../../services/api';

export default function DigitalTwinPage() {
  const [loading, setLoading] = useState(false);
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [weatherCondition, setWeatherCondition] = useState<string>('moderate_rain');
  const [demandSurge, setDemandSurge] = useState<number>(15);
  const [simResult, setSimResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runSimulation();
  }, []);

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await digitalTwinApi.simulate({
        horizon_days: horizonDays,
        weather_condition: weatherCondition,
        demand_surge_pct: demandSurge,
      });
      setSimResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to execute digital twin simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Watermark Banner */}
      <div className="p-4 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-xl flex items-center justify-between text-amber-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
            <Cpu size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
                Digital Twin Mode
              </span>
              <p className="text-sm font-bold text-amber-950">Synthetic Scenario Simulation</p>
            </div>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Operating on Monte Carlo stochastic models. These metrics represent what-if projections rather than physical live telemetry.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-100/80 text-amber-900 hidden sm:inline-block">
          PROBABILISTIC DISCRETE-EVENT ENGINE
        </span>
      </div>

      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Fleet Operations What-If Simulator</h1>
            <p className="text-xs text-gray-500">
              Stress-test dispatch policies under weather disruptions, traffic variance, and demand volatility.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Rerun Simulation</span>
          </button>
        </div>

        {/* Parameter Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Simulation Time Horizon</label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="7">7 Days (Weekly Operations Cycle)</option>
              <option value="14">14 Days (Bi-Weekly Stress Cycle)</option>
              <option value="30">30 Days (Monthly Full Horizon)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Weather & Road Friction Condition</label>
            <select
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="clear">Clear Skies (Baseline Speed: 1.0x)</option>
              <option value="moderate_rain">Moderate Rain (+18% Delay Shock)</option>
              <option value="heavy_monsoon">Heavy Monsoon (+42% Delay & Breakdown Spike)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-gray-700">Demand Surge Volatility</label>
              <span className="font-bold text-emerald-700 font-mono">+{demandSurge}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={demandSurge}
              onChange={(e) => setDemandSurge(parseInt(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Side-by-Side Comparison Cards */}
      {simResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Operating Cost Delta */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Operating Cost</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                -{simResult.cost_savings_pct}%
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">₹{simResult.optimized_total_cost_inr.toLocaleString()}</p>
              <p className="text-xs text-gray-400 line-through">₹{simResult.baseline_total_cost_inr.toLocaleString()} (Baseline)</p>
            </div>
            <p className="text-xs text-emerald-700 font-semibold pt-1 border-t border-gray-50">
              ₹{simResult.cost_savings_inr.toLocaleString()} Saved
            </p>
          </div>

          {/* Fuel Consumption Delta */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Fuel Consumed</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                -{simResult.fuel_savings_pct}%
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{simResult.optimized_total_fuel_liters.toLocaleString()} L</p>
              <p className="text-xs text-gray-400 line-through">{simResult.baseline_total_fuel_liters.toLocaleString()} L (Baseline)</p>
            </div>
            <p className="text-xs text-emerald-700 font-semibold pt-1 border-t border-gray-50">
              {simResult.fuel_savings_liters.toLocaleString()} L Conserved
            </p>
          </div>

          {/* CO2 Emissions Delta */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Carbon Abated</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                -{simResult.co2_reduction_pct}%
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">{simResult.optimized_total_co2_kg.toLocaleString()} kg</p>
              <p className="text-xs text-gray-400 line-through">{simResult.baseline_total_co2_kg.toLocaleString()} kg (Baseline)</p>
            </div>
            <p className="text-xs text-emerald-700 font-semibold pt-1 border-t border-gray-50">
              {simResult.co2_reduction_kg.toLocaleString()} kg CO2 Avoided
            </p>
          </div>

          {/* On-Time Delivery Rate */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Punctuality Rate</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                +{simResult.on_time_improvement_pct}%
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{simResult.optimized_on_time_rate_pct}%</p>
              <p className="text-xs text-gray-400">Baseline was {simResult.baseline_on_time_rate_pct}%</p>
            </div>
            <p className="text-xs text-gray-500 pt-1 border-t border-gray-50">
              Breakdowns: <strong className="text-emerald-700">{simResult.optimized_breakdown_incidents}</strong> vs {simResult.baseline_breakdown_incidents}
            </p>
          </div>
        </div>
      )}

      {/* Daily Timeline Fuel Comparison Chart */}
      {simResult && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Day-by-Day Fuel Consumption Trajectory (Liters)</h3>
            <span className="text-xs text-gray-400">Daily stochastic Monte Carlo realizations</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simResult.timeline} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}L`} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold text-emerald-400">{d.day_name} (Day {d.day_number})</p>
                          <p>Baseline Fuel: {d.fuel_liters_baseline} L</p>
                          <p>Optimized Fuel: {d.fuel_liters_optimized} L</p>
                          <p>Delay Hours: {d.traffic_delay_hours} hrs</p>
                          <p>Punctuality: {d.on_time_pct}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="fuel_liters_baseline" name="Baseline Dispatch" stroke="#94a3b8" fill="#e2e8f0" />
                <Area type="monotone" dataKey="fuel_liters_optimized" name="Quantum-Inspired Dispatch" stroke="#047857" fill="#10b981" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Simulator AI Insights List */}
      {simResult && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Digital Twin Synthesis & Policy Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simResult.insights.map((insight: string, idx: number) => (
              <div key={idx} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-gray-700 flex items-start gap-2.5">
                <CheckCircle size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
