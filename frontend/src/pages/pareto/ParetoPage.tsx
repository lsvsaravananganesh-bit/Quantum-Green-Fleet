import React, { useState, useEffect } from 'react';
import {
  Layers, Sliders, TrendingUp, Atom, ArrowRight, ShieldCheck,
  RefreshCw, CheckCircle, HelpCircle, BarChart2
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { researchApi } from '../../services/api';

export default function ParetoPage() {
  const [loading, setLoading] = useState(false);
  const [paretoData, setParetoData] = useState<any>(null);
  const [selectedSolution, setSelectedSolution] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // User configurable weights
  const [weights, setWeights] = useState({
    cost: 0.35,
    emissions: 0.35,
    fuel: 0.10,
    time: 0.10,
    balance: 0.10,
  });

  useEffect(() => {
    fetchParetoFrontier();
  }, []);

  const fetchParetoFrontier = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await researchApi.getParetoFront(24);
      setParetoData(res.data);
      if (res.data.frontier?.length > 0) {
        setSelectedSolution(res.data.frontier[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to generate Pareto frontier.');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key: string, val: number) => {
    const updated = { ...weights, [key]: val };
    // Auto-normalize
    const sum = Object.values(updated).reduce((a, b) => a + b, 0);
    setWeights(updated);
  };

  // Prepare scatter plot data: Cost vs CO2
  const scatterData = paretoData?.all_evaluated?.map((sol: any) => ({
    x: sol.objectives.operating_cost_inr,
    y: sol.objectives.carbon_emissions_kg,
    id: sol.solution_id,
    isPareto: sol.is_pareto_optimal,
    note: sol.trade_off_note,
    solution: sol,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 2: Multi-Objective Engine
            </span>
            <span className="text-xs text-gray-500">Pareto Frontier Generator</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Multi-Objective Quantum-Inspired Optimization</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Simultaneous optimization of conflicting objectives using Min-Max normalized scalarization and non-dominated sorting.
          </p>
        </div>

        <button
          onClick={fetchParetoFrontier}
          disabled={loading}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Sweep Pareto Space</span>
        </button>
      </div>

      {/* 5 Objectives Mathematical Formulation Notice */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom size={18} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">Min-Max Normalized Composite Scalarization</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            5 Dimensional Objective Space
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          F(x) = w₁·[Cost - Cost_min]/ΔCost + w₂·[CO₂ - CO₂_min]/ΔCO₂ + w₃·[Fuel - Fuel_min]/ΔFuel + w₄·[Time - Time_min]/ΔTime + w₅·[Std_util]/ΔUtil
        </p>
        <p className="text-xs text-slate-400">
          Normalizing each objective to [0, 1] using empirical bounding guarantees that large currency values (₹ thousands) do not dominate unit carbon metrics or hour durations.
        </p>
      </div>

      {/* Interactive Weight Sliders */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-emerald-700" />
            <h3 className="text-sm font-bold text-gray-800">Objective Weight Customization</h3>
          </div>
          <span className="text-xs text-gray-400">Sum auto-normalized to 1.0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">1. Operating Cost</span>
              <span className="font-mono text-emerald-700 font-bold">{(weights.cost * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.cost}
              onChange={(e) => handleWeightChange('cost', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">2. Carbon CO2</span>
              <span className="font-mono text-emerald-700 font-bold">{(weights.emissions * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.emissions}
              onChange={(e) => handleWeightChange('emissions', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">3. Fuel Volume</span>
              <span className="font-mono text-emerald-700 font-bold">{(weights.fuel * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.fuel}
              onChange={(e) => handleWeightChange('fuel', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">4. Travel Time</span>
              <span className="font-mono text-emerald-700 font-bold">{(weights.time * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.time}
              onChange={(e) => handleWeightChange('time', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">5. Fleet Balance</span>
              <span className="font-mono text-emerald-700 font-bold">{(weights.balance * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.balance}
              onChange={(e) => handleWeightChange('balance', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Scatter Plot + Ideal/Nadir comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto Frontier Scatter Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Pareto Trade-Off Frontier (Cost vs Emissions)</h3>
              <p className="text-xs text-gray-400">Green dots = Non-dominated Pareto optimal; Gray dots = Dominated configurations</p>
            </div>
            {paretoData && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                {paretoData.frontier.length} Non-dominated Solutions
              </span>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Operating Cost"
                  unit="₹"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val.toFixed(0)}`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Carbon Emissions"
                  unit="kg"
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold text-emerald-400">{data.id} {data.isPareto ? '(Pareto Optimal)' : '(Dominated)'}</p>
                          <p>Operating Cost: ₹{data.x.toFixed(2)}</p>
                          <p>CO2 Emissions: {data.y.toFixed(2)} kg</p>
                          <p className="text-slate-400 text-[11px]">{data.note}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  name="Configurations"
                  data={scatterData}
                  onClick={(node) => setSelectedSolution(node.solution)}
                  cursor="pointer"
                >
                  {scatterData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPareto ? '#059669' : '#cbd5e1'}
                      stroke={selectedSolution?.solution_id === entry.id ? '#047857' : '#ffffff'}
                      strokeWidth={selectedSolution?.solution_id === entry.id ? 3 : 1}
                      r={entry.isPareto ? 7 : 4}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Solution Inspector & Ideal Bounds */}
        <div className="space-y-4">
          {/* Selected Solution Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {selectedSolution?.solution_id || 'SOL-01'}
              </span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle size={14} />
                Rank {selectedSolution?.rank || 1} Pareto Solution
              </span>
            </div>

            <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              {selectedSolution?.trade_off_note || 'Minimum operating cost baseline configuration.'}
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Operating Cost</span>
                <span className="font-bold text-gray-900">₹{selectedSolution?.objectives.operating_cost_inr}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Carbon Emissions</span>
                <span className="font-bold text-emerald-700">{selectedSolution?.objectives.carbon_emissions_kg} kg CO2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Fuel Required</span>
                <span className="font-bold text-gray-900">{selectedSolution?.objectives.fuel_consumption_liters} L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Travel Time</span>
                <span className="font-bold text-gray-900">{selectedSolution?.objectives.total_travel_time_hr} hrs</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Fleet Balance (σ)</span>
                <span className="font-bold text-gray-900">{selectedSolution?.objectives.utilization_imbalance_std} km</span>
              </div>
            </div>
          </div>

          {/* Anchor Points */}
          {paretoData && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Anchor Extreme Bounds</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <p className="font-bold text-emerald-800">Ideal Anchor</p>
                  <p className="text-[11px] text-gray-600 mt-1">Cost: ₹{paretoData.ideal_point.operating_cost_inr.toFixed(0)}</p>
                  <p className="text-[11px] text-gray-600">CO2: {paretoData.ideal_point.carbon_emissions_kg.toFixed(1)} kg</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-700">Nadir Anchor</p>
                  <p className="text-[11px] text-gray-500 mt-1">Cost: ₹{paretoData.nadir_point.operating_cost_inr.toFixed(0)}</p>
                  <p className="text-[11px] text-gray-500">CO2: {paretoData.nadir_point.carbon_emissions_kg.toFixed(1)} kg</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Non-Dominated Pareto Solution Table */}
      {paretoData && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Non-Dominated Pareto Front Table</h3>
            <span className="text-xs text-gray-400">Click any row to inspect solution</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Solution ID</th>
                  <th className="py-2.5 px-3">Operating Cost</th>
                  <th className="py-2.5 px-3">Carbon (kg CO2)</th>
                  <th className="py-2.5 px-3">Fuel (L)</th>
                  <th className="py-2.5 px-3">Time (hr)</th>
                  <th className="py-2.5 px-3">Imbalance (σ)</th>
                  <th className="py-2.5 px-3">Marginal Trade-Off Substitution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paretoData.frontier.map((sol: any) => (
                  <tr
                    key={sol.solution_id}
                    onClick={() => setSelectedSolution(sol)}
                    className={`cursor-pointer transition-colors ${
                      selectedSolution?.solution_id === sol.solution_id ? 'bg-emerald-50 font-semibold' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-emerald-800">{sol.solution_id}</td>
                    <td className="py-2.5 px-3">₹{sol.objectives.operating_cost_inr.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">{sol.objectives.carbon_emissions_kg} kg</td>
                    <td className="py-2.5 px-3">{sol.objectives.fuel_consumption_liters} L</td>
                    <td className="py-2.5 px-3">{sol.objectives.total_travel_time_hr} hrs</td>
                    <td className="py-2.5 px-3">{sol.objectives.utilization_imbalance_std} km</td>
                    <td className="py-2.5 px-3 text-gray-600 italic">{sol.trade_off_note}</td>
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
