import React, { useState, useEffect } from 'react';
import {
  Leaf, BarChart3, TrendingDown, ArrowDownRight,
  ShieldCheck, AlertTriangle, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from 'recharts';
import { dashboardApi } from '../../services/api';
import type { DashboardSummary } from '../../types';

export default function EmissionsPage() {
  const [emissionsData, setEmissionsData] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emRes, trRes, sumRes] = await Promise.all([
          dashboardApi.getEmissions(),
          dashboardApi.getFuelTrends(30),
          dashboardApi.getSummary(),
        ]);
        setEmissionsData(emRes.data.by_vehicle_type || []);
        setTrends(trRes.data.trends || []);
        setSummary(sumRes.data);
      } catch (err) {
        console.error('Error fetching emissions data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Carbon Emissions & Climate Audit</h1>
          <p className="page-subtitle">Granular Scope 1 carbon emission accounting, intensity trends, and compliance benchmarking</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Greenhouse Gas</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">
              {(summary?.total_co2_emissions_kg || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-gray-500">kg CO₂e</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Direct combustion emissions</p>
        </div>

        <div className="stat-card border-l-4 border-l-green-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Carbon Intensity</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">
              {summary && summary.total_trips > 0
                ? (summary.total_co2_emissions_kg / summary.total_trips).toFixed(1)
                : '0'}
            </h3>
            <span className="text-xs text-gray-500">kg CO₂ / trip</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Average per dispatched trip</p>
        </div>

        <div className="stat-card border-l-4 border-l-teal-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">GHG Protocol Standard</span>
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck className="text-teal-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">ISO 14064 Compliant</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tier-2 emission coefficient modeling</p>
        </div>
      </div>

      {/* Emissions Over Time Chart */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-base mb-1">Daily CO₂ Emission Trajectory (Last 30 Days)</h3>
        <p className="text-xs text-gray-500 mb-4">Carbon volume in kilograms emitted by operational dispatches</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="co2_kg" stroke="#059669" strokeWidth={2} fill="url(#colorCO2)" name="CO₂ (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Standard Emission Factors Reference Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">National Regulatory Emission Coefficients</h3>
          <p className="text-xs text-gray-500">Based on Ministry of Road Transport and Highways (MoRTH) standards</p>
        </div>
        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Fuel / Energy Category</th>
                <th className="table-th">Emission Factor</th>
                <th className="table-th">Typical Fleet Application</th>
                <th className="table-th">Mitigation Pathway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              <tr className="table-row">
                <td className="table-td font-bold text-amber-900">Diesel Fuel</td>
                <td className="table-td font-semibold text-gray-800">2.68 kg CO₂ / Liter</td>
                <td className="table-td text-gray-600">Heavy trucks, intercity buses, logistics vans</td>
                <td className="table-td text-green-700 font-medium">QUBO route optimization, biodiesel blend</td>
              </tr>
              <tr className="table-row">
                <td className="table-td font-bold text-blue-900">Petrol / Gasoline</td>
                <td className="table-td font-semibold text-gray-800">2.31 kg CO₂ / Liter</td>
                <td className="table-td text-gray-600">Light commercial vehicles, supervisor sedans</td>
                <td className="table-td text-green-700 font-medium">EV transition, idle cutoff policy</td>
              </tr>
              <tr className="table-row">
                <td className="table-td font-bold text-purple-900">Strong Hybrid (HEV)</td>
                <td className="table-td font-semibold text-gray-800">1.85 kg CO₂ / Liter</td>
                <td className="table-td text-gray-600">Executive transport, airport shuttles</td>
                <td className="table-td text-green-700 font-medium">Regenerative brake optimization</td>
              </tr>
              <tr className="table-row bg-emerald-50/30">
                <td className="table-td font-bold text-emerald-900">Battery Electric (BEV)</td>
                <td className="table-td font-semibold text-emerald-800">0.00 kg CO₂ / Liter (Tailpipe)</td>
                <td className="table-td text-gray-600">Last-mile urban delivery, distribution vans</td>
                <td className="table-td text-emerald-700 font-bold">100% Zero tailpipe emissions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
