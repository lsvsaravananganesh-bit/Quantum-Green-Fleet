import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, RefreshCw, AlertTriangle, TrendingUp,
  BarChart2, Info, ArrowUpRight, CheckCircle, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { researchApi } from '../../services/api';

export default function SensitivityPage() {
  const [loading, setLoading] = useState(false);
  const [numScenarios, setNumScenarios] = useState<number>(300);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runSensitivityAnalysis();
  }, []);

  const runSensitivityAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await researchApi.runSensitivity(numScenarios);
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to execute sensitivity analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 7: Risk Management
            </span>
            <span className="text-xs text-gray-500">Monte Carlo Stress Testing</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Robust Optimization & Sensitivity Analysis</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quantify financial risk, tail dispersion, and operational elasticity under macroeconomic and traffic shocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium">
            <span className="text-gray-500">Scenarios:</span>
            <select
              value={numScenarios}
              onChange={(e) => setNumScenarios(parseInt(e.target.value))}
              className="bg-transparent font-bold text-gray-800 focus:outline-none"
            >
              <option value="100">100 Scenarios</option>
              <option value="300">300 Scenarios</option>
              <option value="500">500 Scenarios</option>
            </select>
          </div>

          <button
            onClick={runSensitivityAnalysis}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Simulate Shocks</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Risk Metrics Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Expected Cost E[C]</p>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{data.expected_cost_inr.toLocaleString()}</p>
            <span className="text-[11px] text-gray-500 font-medium">σ = ±₹{data.cost_std_dev_inr}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Value at Risk (VaR 95%)</p>
            <p className="text-xl font-bold text-amber-600 mt-1">₹{data.var_95_inr.toLocaleString()}</p>
            <span className="text-[11px] text-amber-700 font-medium">95% confidence cap</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Conditional VaR (CVaR 95%)</p>
            <p className="text-xl font-bold text-red-600 mt-1">₹{data.cvar_95_inr.toLocaleString()}</p>
            <span className="text-[11px] text-red-600 font-medium">Worst 5% expected shortfall</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Max Worst Case</p>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{data.max_worst_cost_inr.toLocaleString()}</p>
            <span className="text-[11px] text-gray-400 font-medium">Extreme shock ceiling</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Robustness Index</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{data.robustness_index} / 100</p>
            <span className="text-[11px] text-emerald-600 font-medium">Tail resilience score</span>
          </div>
        </div>
      )}

      {/* Tornado Sensitivity Chart & Monte Carlo Distribution */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tornado Sensitivity Bar Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Tornado Sensitivity Analysis (±25% Parameter Swing)</h3>
                <p className="text-xs text-gray-400">Ranked by overall cost volatility impact</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                Rank 1: {data.tornado_sensitivity[0]?.parameter_name}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.tornado_sensitivity}
                  margin={{ top: 10, right: 20, bottom: 10, left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="parameter_name" stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-emerald-400">{d.parameter_name} (Rank #{d.sensitivity_rank})</p>
                            <p>Base Cost: ₹{d.base_cost_inr.toLocaleString()}</p>
                            <p>-25% Param Cost: ₹{d.low_cost_inr.toLocaleString()}</p>
                            <p>+25% Param Cost: ₹{d.high_cost_inr.toLocaleString()}</p>
                            <p className="text-amber-400 font-bold">Total Swing: ₹{d.swing_inr.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="swing_inr" fill="#047857" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monte Carlo Sample Realization Histogram */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Stochastic Cost Outcomes Sample</h3>
                <p className="text-xs text-gray-400">Monte Carlo scenario evaluations</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">Sample: {data.scenarios_sample.length} runs</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.scenarios_sample} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="scenario_index" stroke="#94a3b8" fontSize={11} label={{ value: 'Scenario #', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-emerald-400">Scenario #{d.scenario_index}</p>
                            <p>Operating Cost: ₹{d.total_cost_inr.toLocaleString()}</p>
                            <p>CO2: {d.total_emissions_kg} kg</p>
                            <p>Fuel Price Mult: {d.fuel_price_factor}x</p>
                            <p>Traffic Delay Mult: {d.traffic_factor}x</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="total_cost_inr" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Executive Risk Insights */}
      {data && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Risk Mitigation & Sensitivity Findings</h3>
          <div className="space-y-2">
            {data.risk_summary.map((sum: string, sIdx: number) => (
              <div key={sIdx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-700 flex items-start gap-2.5">
                <CheckCircle size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{sum}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
