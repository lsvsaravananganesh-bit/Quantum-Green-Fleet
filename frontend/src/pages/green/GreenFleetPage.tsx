import React, { useState, useEffect } from 'react';
import {
  Leaf, Zap, TrendingDown, Award, ShieldCheck,
  BatteryCharging, DollarSign, ArrowUpRight, CheckCircle2, Trees
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { vehiclesApi, dashboardApi } from '../../services/api';
import type { Vehicle, DashboardSummary } from '../../types';

export default function GreenFleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // EV Replacement Calculator state
  const [dieselToReplace, setDieselToReplace] = useState(3);
  const [avgKmPerDay, setAvgKmPerDay] = useState(150);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, sRes] = await Promise.all([
          vehiclesApi.getVehicles({ page_size: 100 }),
          dashboardApi.getSummary(),
        ]);
        setVehicles(vRes.data.data);
        setSummary(sRes.data);
      } catch (err) {
        console.error('Error fetching green fleet data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fuel breakdown
  const fuelCounts = vehicles.reduce((acc, v) => {
    acc[v.fuel_type] = (acc[v.fuel_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(fuelCounts).map(([type, count]) => ({
    name: type.toUpperCase(),
    value: count,
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  // Calculations for EV transition:
  // Diesel: ~10 km/L -> 0.1 L/km * 90.25 INR/L = 9.02 INR/km, 0.268 kg CO2/km
  // EV: ~0.25 kWh/km * 8 INR/kWh = 2.0 INR/km, 0 kg tailpipe CO2
  // Savings per km: 7.02 INR, 0.268 kg CO2
  const annualKm = dieselToReplace * avgKmPerDay * 300; // 300 working days
  const annualFuelSavedINR = Math.round(annualKm * 7.02);
  const annualCO2SavedKg = Math.round(annualKm * 0.268);
  const treesEquivalent = Math.round(annualCO2SavedKg / 22); // 1 mature tree absorbs ~22kg CO2/year

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Green Fleet & Electrification Command</h1>
          <p className="page-subtitle">Decarbonization strategy, EV parity simulations, and ESG sustainability compliance</p>
        </div>
      </div>

      {/* Top Green Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">ESG Sustainability Index</span>
          <div className="flex items-center gap-2 mt-2">
            <Award className="text-emerald-600" size={26} />
            <h3 className="text-2xl font-black text-gray-900">A- (Tier 1)</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Verified Scope-1 transport compliance</p>
        </div>

        <div className="stat-card border-l-4 border-l-green-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Carbon Output</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">
              {(summary?.total_co2_emissions_kg || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-gray-500">kg CO₂</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">From completed commercial dispatches</p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">EV Transition Target</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">35%</h3>
            <span className="text-xs text-gray-500">by 2028</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Current fleet zero-emission: 10%</p>
        </div>

        <div className="stat-card border-l-4 border-l-teal-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Carbon Offset Offset</span>
          <div className="flex items-center gap-2 mt-2">
            <Trees className="text-teal-600" size={26} />
            <h3 className="text-2xl font-black text-gray-900">{Math.round((summary?.total_co2_emissions_kg || 0) / 22)}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tree absorption equivalents</p>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fleet Fuel Composition (5 Cols) */}
        <div className="lg:col-span-5 card flex flex-col">
          <h3 className="font-bold text-gray-900 text-base mb-1">Powertrain Composition</h3>
          <p className="text-xs text-gray-500 mb-4">Breakdown of operational fleet across fuel technologies</p>

          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="font-medium text-gray-700">{entry.name}:</span>
                <span className="font-bold text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EV Replacement Simulator (7 Cols) */}
        <div className="lg:col-span-7 card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <BatteryCharging size={18} className="text-green-700" />
                <span>EV Fleet Conversion ROI Calculator</span>
              </h3>
              <p className="text-xs text-gray-500">Simulate operational cost savings and carbon abatement</p>
            </div>
          </div>

          {/* Calculator Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Diesel Vehicles to Transition</label>
              <input
                type="number"
                min="1"
                max="50"
                value={dieselToReplace}
                onChange={(e) => setDieselToReplace(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field font-semibold text-green-800"
              />
            </div>
            <div>
              <label className="label">Avg Utilization (km/day/vehicle)</label>
              <input
                type="number"
                min="30"
                max="800"
                value={avgKmPerDay}
                onChange={(e) => setAvgKmPerDay(Math.max(30, parseInt(e.target.value) || 30))}
                className="input-field font-semibold text-green-800"
              />
            </div>
          </div>

          {/* Simulated Returns */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-[11px] text-emerald-800 font-semibold uppercase">Annual Cost Savings</span>
              <p className="text-xl font-black text-gray-900 mt-1">₹{annualFuelSavedINR.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-700">₹7.02 net savings / km</span>
            </div>

            <div className="p-3.5 bg-green-50 rounded-xl border border-green-100 text-center">
              <span className="text-[11px] text-green-800 font-semibold uppercase">Annual CO₂ Abatement</span>
              <p className="text-xl font-black text-green-950 mt-1">{(annualCO2SavedKg / 1000).toFixed(1)} <span className="text-xs font-normal">Tons</span></p>
              <span className="text-[10px] text-green-700">Scope 1 reduction</span>
            </div>

            <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-100 text-center">
              <span className="text-[11px] text-teal-800 font-semibold uppercase">Tree Equivalence</span>
              <p className="text-xl font-black text-teal-950 mt-1">{treesEquivalent.toLocaleString()}</p>
              <span className="text-[10px] text-teal-700">Trees planted eq.</span>
            </div>
          </div>

          {/* Strategic Guidelines */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
            <p className="font-bold text-gray-800">⚡ Electrification Recommendations:</p>
            <p>• Prioritize transitioning <strong>Urban Delivery Vans</strong> first due to frequent stop-and-go regenerative braking efficiency.</p>
            <p>• Off-peak overnight depot charging at commercial industrial tariff (₹8/kWh) maximizes per-km savings.</p>
            <p>• Estimated payback period for initial battery capex premium is approximately <strong>2.8 years</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
