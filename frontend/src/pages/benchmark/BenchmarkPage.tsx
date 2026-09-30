import React, { useState, useEffect } from 'react';
import {
  Activity, Play, RefreshCw, AlertTriangle, CheckCircle,
  Clock, Shield, BarChart2, Info, ChevronRight, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { researchApi } from '../../services/api';

export default function BenchmarkPage() {
  const [loading, setLoading] = useState(false);
  const [numSeeds, setNumSeeds] = useState<number>(5);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runBenchmark();
  }, []);

  const runBenchmark = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await researchApi.runBenchmark(numSeeds);
      setBenchmarkResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to execute benchmarking lab.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for Execution Time vs Objective Value
  const chartData = benchmarkResult?.algorithms?.map((alg: any) => ({
    name: alg.algorithm_name.replace(' Algorithm', '').replace('Classical ', ''),
    meanTime: alg.execution_time_ms.mean,
    meanObjective: alg.objective_value.mean,
    bestObjective: alg.best_objective,
    stdObjective: alg.objective_value.std,
    category: alg.category,
    feasibility: alg.success_rate_pct,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 3: Benchmark Laboratory
            </span>
            <span className="text-xs text-gray-500">Multi-Seed Statistical Rigor</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Quantum-Inspired Benchmarking Lab</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Empirical comparative evaluation of classical heuristics against simulated quantum annealing across multi-seed runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium">
            <span className="text-gray-500">Repeats:</span>
            <select
              value={numSeeds}
              onChange={(e) => setNumSeeds(parseInt(e.target.value))}
              className="bg-transparent font-bold text-gray-800 focus:outline-none"
            >
              <option value="3">3 Seeds</option>
              <option value="5">5 Seeds</option>
              <option value="10">10 Seeds</option>
            </select>
          </div>

          <button
            onClick={runBenchmark}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Execute Benchmark</span>
          </button>
        </div>
      </div>

      {/* Scientific Transparency Disclaimer Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start gap-3 shadow-sm">
        <Info size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-emerald-400 uppercase tracking-wider">Scientific Disclaimer & Reproducibility Notice</p>
          <p className="text-slate-300 leading-relaxed">
            Quantum-inspired optimization algorithms in this lab (Transverse-Field SQA and QUBO SA) are mathematical simulations executed entirely on classical silicon CPUs. Comparisons evaluate algorithmic search heuristic properties, barrier-crossing efficacy, and execution latency. No physical quantum hardware or quantum supremacy is asserted.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Winner Ticker Cards */}
      {benchmarkResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Fastest Computation</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{benchmarkResult.fastest_algorithm}</p>
              <span className="text-[11px] text-blue-600 font-medium">Deterministic low-latency</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Best Solution Quality</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{benchmarkResult.best_quality_algorithm}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Lowest energy objective</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Problem Dimensions</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">
                {benchmarkResult.problem_size.vehicles} Vehicles × {benchmarkResult.problem_size.trips} Trips
              </p>
              <span className="text-[11px] text-purple-600 font-medium">{benchmarkResult.num_seeds} multi-seed repetitions</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Visualizations Grid */}
      {benchmarkResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Objective Quality Bar Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Mean Objective Cost by Algorithm (Lower is Better)</h3>
            <p className="text-xs text-gray-400">Mean energy/cost score across {numSeeds} randomized seed runs</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-emerald-400">{d.name} ({d.category})</p>
                            <p>Mean Objective: ₹{d.meanObjective.toFixed(2)}</p>
                            <p>Best Single Run: ₹{d.bestObjective.toFixed(2)}</p>
                            <p>Std Dev (σ): ±₹{d.stdObjective.toFixed(2)}</p>
                            <p>Feasibility: {d.feasibility}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="meanObjective" fill="#047857" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Execution Time (ms) Bar Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Computational Latency (ms) (Lower is Faster)</h3>
            <p className="text-xs text-gray-400">Wall-clock execution time per run</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v.toFixed(0)}ms`} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-blue-400">{d.name}</p>
                            <p>Execution Time: {d.meanTime.toFixed(2)} ms</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="meanTime" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Statistical Breakdown Table */}
      {benchmarkResult && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Empirical Benchmark Summary Matrix</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Paradigmatic Category</th>
                  <th className="py-2.5 px-3">Mean Runtime</th>
                  <th className="py-2.5 px-3">Mean Objective</th>
                  <th className="py-2.5 px-3">Std Dev (σ)</th>
                  <th className="py-2.5 px-3">Best Objective</th>
                  <th className="py-2.5 px-3">Feasibility Rate</th>
                  <th className="py-2.5 px-3">Theoretical Characteristic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {benchmarkResult.algorithms.map((alg: any) => (
                  <tr key={alg.algorithm_id} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{alg.algorithm_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {alg.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{alg.execution_time_ms.mean} ms</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">₹{alg.objective_value.mean.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-500">±₹{alg.objective_value.std}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">₹{alg.best_objective.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        alg.success_rate_pct === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alg.success_rate_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate" title={alg.scientific_notes}>
                      {alg.scientific_notes}
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
