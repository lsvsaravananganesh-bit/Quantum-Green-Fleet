import React, { useState, useEffect } from 'react';
import {
  Atom, Zap, CheckCircle2, TrendingDown, Clock, AlertTriangle,
  Play, RefreshCw, BarChart2, Layers, ShieldCheck, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { optimizationApi } from '../../services/api';
import type { OptimizationResult, AlgorithmComparison } from '../../types';

export default function OptimizationPage() {
  const [algorithm, setAlgorithm] = useState('simulated_annealing');
  const [runName, setRunName] = useState(`Optimization-Run-${new Date().toISOString().slice(0, 10)}`);
  const [costWeight, setCostWeight] = useState(0.6);
  const [emissionsWeight, setEmissionsWeight] = useState(0.4);

  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [comparison, setComparison] = useState<AlgorithmComparison[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await optimizationApi.runOptimization({
        algorithm,
        run_name: runName,
        objective_weights: {
          cost: costWeight,
          emissions: emissionsWeight,
        },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareAll = async () => {
    setComparing(true);
    setError(null);
    try {
      const res = await optimizationApi.compareAlgorithms({});
      setComparison(res.data.comparison || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Algorithm comparison failed');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Quantum-Inspired Fleet Optimization Studio</h1>
          <p className="page-subtitle">Formulate Quadratic Unconstrained Binary Optimization (QUBO) matrices and solve vehicle dispatch</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCompareAll}
            disabled={comparing}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 shadow-sm"
          >
            {comparing ? (
              <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <BarChart2 size={15} />
            )}
            <span>Benchmark All Solvers</span>
          </button>
        </div>
      </div>

      {/* Control Panel & Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 card space-y-4">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Atom size={18} className="text-green-700" />
            <span>QUBO Solver Parameters</span>
          </h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">Run Name</label>
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              className="input-field text-xs font-medium"
            />
          </div>

          <div>
            <label className="label">Optimization Solver</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="select-field text-xs"
            >
              <option value="simulated_annealing">⚛️ Quantum QUBO + Simulated Annealing</option>
              <option value="classical_greedy">⚡ Classical Greedy Solver</option>
              <option value="genetic_algorithm">🧬 Evolutionary Genetic Algorithm</option>
              <option value="random_baseline">🎲 Random Allocation Baseline</option>
            </select>
          </div>

          {/* Weight sliders */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>Fuel Cost Priority (α)</span>
                <span className="font-bold text-green-700">{Math.round(costWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={costWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCostWeight(val);
                  setEmissionsWeight(parseFloat((1 - val).toFixed(2)));
                }}
                className="w-full accent-green-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>Carbon Reduction Priority (β)</span>
                <span className="font-bold text-emerald-700">{Math.round(emissionsWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={emissionsWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEmissionsWeight(val);
                  setCostWeight(parseFloat((1 - val).toFixed(2)));
                }}
                className="w-full accent-emerald-700"
              />
            </div>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs shadow-md mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play size={16} />
                <span>Execute QUBO Dispatch</span>
              </>
            )}
          </button>
        </div>

        {/* Results Overview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {result ? (
            <div className="card space-y-5 border-2 border-green-700/20">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">Dispatch Outcome</span>
                  <h3 className="font-bold text-gray-900 text-lg">{result.run_name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-info text-xs font-mono uppercase">{result.algorithm.replace('_', ' ')}</span>
                  <span className="badge-success text-xs flex items-center gap-1">
                    <CheckCircle2 size={12} /> Feasible
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-medium">Fuel Consumed</span>
                  <p className="text-xl font-black text-gray-900 mt-1">
                    {result.total_fuel_liters.toLocaleString()} <span className="text-xs font-normal text-gray-500">L</span>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-medium">Total Cost</span>
                  <p className="text-xl font-black text-gray-900 mt-1">
                    ₹{result.total_fuel_cost_inr.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-medium">CO₂ Emissions</span>
                  <p className="text-xl font-black text-emerald-800 mt-1">
                    {result.total_emissions_kg.toLocaleString()} <span className="text-xs font-normal text-gray-500">kg</span>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-medium">Compute Time</span>
                  <p className="text-xl font-black text-blue-900 mt-1">
                    {result.computation_time_ms.toFixed(1)} <span className="text-xs font-normal text-gray-500">ms</span>
                  </p>
                </div>
              </div>

              {/* Assignments Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Optimal Vehicle-Trip Allocations ({result.assignments.length} Assigned)
                </h4>
                <div className="table-container max-h-72 overflow-y-auto border border-gray-100">
                  <table className="table">
                    <thead className="table-header sticky top-0">
                      <tr>
                        <th className="table-th">Trip Code</th>
                        <th className="table-th">Route</th>
                        <th className="table-th">Allocated Vehicle</th>
                        <th className="table-th">Expected Fuel</th>
                        <th className="table-th">Cost (₹)</th>
                        <th className="table-th">CO₂ (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.assignments.map((a) => (
                        <tr key={a.trip_id} className="table-row text-xs">
                          <td className="table-td font-mono font-bold text-gray-900">{a.trip_code}</td>
                          <td className="table-td text-gray-700">
                            {a.origin} → {a.destination} ({a.distance_km} km)
                          </td>
                          <td className="table-td">
                            <span className="font-semibold text-gray-900">{a.registration_number}</span>
                            <span className="text-gray-400 capitalize ml-1">({a.vehicle_type})</span>
                          </td>
                          <td className="table-td font-semibold text-gray-800">{a.predicted_fuel_liters} L</td>
                          <td className="table-td font-medium text-gray-900">₹{a.fuel_cost_inr.toLocaleString()}</td>
                          <td className="table-td font-semibold text-emerald-800">{a.co2_emissions_kg} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 text-gray-400">
                <Atom size={28} />
              </div>
              <h3 className="font-bold text-gray-700 text-sm">No Active QUBO Dispatch Run</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Configure your objective weights on the left and click "Execute QUBO Dispatch", or click "Benchmark All Solvers" above to compare algorithms.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Comparison Section */}
      {comparison.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Algorithm Performance Benchmarks</h3>
              <p className="text-xs text-gray-500">Side-by-side comparison across cost, emissions, and computational latency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Comparison Chart */}
            <div className="h-64">
              <p className="text-xs font-bold text-gray-700 mb-2">Total Fuel Cost (₹) by Algorithm (Lower is Better)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="algorithm"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickFormatter={(a) => a.replace('_', ' ').toUpperCase()}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total_fuel_cost_inr" fill="#16a34a" radius={[6, 6, 0, 0]} name="Cost (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Emissions Comparison Chart */}
            <div className="h-64">
              <p className="text-xs font-bold text-gray-700 mb-2">Total Carbon Output (kg CO₂) (Lower is Better)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="algorithm"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickFormatter={(a) => a.replace('_', ' ').toUpperCase()}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total_emissions_kg" fill="#059669" radius={[6, 6, 0, 0]} name="CO₂ (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Algorithm</th>
                  <th className="table-th">Trips Assigned</th>
                  <th className="table-th">Fuel Cost (₹)</th>
                  <th className="table-th">CO₂ (kg)</th>
                  <th className="table-th">Latency (ms)</th>
                  <th className="table-th">Feasible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparison.map((c) => (
                  <tr key={c.algorithm} className="table-row text-xs">
                    <td className="table-td font-bold capitalize text-gray-900">
                      {c.algorithm.replace('_', ' ')}
                    </td>
                    <td className="table-td text-gray-700">{c.trips_assigned}</td>
                    <td className="table-td font-semibold text-gray-900">₹{c.total_fuel_cost_inr.toLocaleString()}</td>
                    <td className="table-td font-semibold text-emerald-800">{c.total_emissions_kg.toLocaleString()} kg</td>
                    <td className="table-td font-mono text-gray-600">{c.computation_time_ms.toFixed(1)} ms</td>
                    <td className="table-td">
                      <span className={c.is_feasible ? 'badge-success' : 'badge-error'}>
                        {c.is_feasible ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
