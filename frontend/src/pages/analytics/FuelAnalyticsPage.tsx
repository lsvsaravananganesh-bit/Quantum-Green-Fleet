import React, { useState, useEffect } from 'react';
import {
  DollarSign, Fuel, TrendingUp, TrendingDown,
  Gauge, Award, Filter, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from 'recharts';
import { dashboardApi } from '../../services/api';
import type { DashboardSummary } from '../../types';

export default function FuelAnalyticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [fleetPerf, setFleetPerf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, trRes, perfRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getFuelTrends(30),
          dashboardApi.getFleetPerformance(),
        ]);
        setSummary(sumRes.data);
        setTrends(trRes.data.trends || []);
        setFleetPerf(perfRes.data.vehicles || []);
      } catch (err) {
        console.error('Error fetching fuel analytics:', err);
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
          <h1 className="page-title text-gray-900">Fuel Expenditure & Financial Intelligence</h1>
          <p className="page-subtitle">Analyze fuel cashflow, price sensitivity, and vehicle mileage economy</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-green-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Expenditure</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-sm font-bold text-gray-500">₹</span>
            <h3 className="text-2xl font-black text-gray-900">
              {(summary?.total_fuel_cost_inr || 0).toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Across all logged journeys</p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fuel Consumed</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">
              {(summary?.total_fuel_consumed || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-gray-500">Liters</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total dispensed volume</p>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average Mileage</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">
              {summary?.avg_efficiency_kmpl || 0}
            </h3>
            <span className="text-xs text-gray-500">km/L</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Fleet composite average</p>
        </div>

        <div className="stat-card border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg Cost per Liter</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-sm font-bold text-gray-500">₹</span>
            <h3 className="text-2xl font-black text-gray-900">
              {summary && summary.total_fuel_consumed > 0
                ? (summary.total_fuel_cost_inr / summary.total_fuel_consumed).toFixed(2)
                : '92.40'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Blended rate</p>
        </div>
      </div>

      {/* Cost Trend Chart */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-base mb-1">Daily Fuel Cost Outflow (Last 30 Days)</h3>
        <p className="text-xs text-gray-500 mb-4">Expenditure curve for operational refueling</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Cost (INR)']}
              />
              <Line type="monotone" dataKey="cost_inr" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} name="Cost (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fleet Mileage Ranking Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Vehicle Efficiency Leaderboard</h3>
            <p className="text-xs text-gray-500">Ranked by actual road efficiency (km/L)</p>
          </div>
        </div>

        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Rank & Vehicle</th>
                <th className="table-th">Type / Fuel</th>
                <th className="table-th">Completed Trips</th>
                <th className="table-th">Total Distance</th>
                <th className="table-th">Total Fuel Burn</th>
                <th className="table-th text-right">Avg Efficiency (km/L)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {fleetPerf.map((v, idx) => (
                <tr key={v.vehicle_id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'text-gray-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-900">{v.registration_number}</span>
                    </div>
                  </td>
                  <td className="table-td capitalize text-gray-600">
                    {v.vehicle_type} ({v.fuel_type})
                  </td>
                  <td className="table-td text-gray-800 font-semibold">{v.total_trips}</td>
                  <td className="table-td text-gray-600 font-mono">{v.total_distance_km.toLocaleString()} km</td>
                  <td className="table-td text-gray-600">{v.total_fuel_liters.toLocaleString()} L</td>
                  <td className="table-td text-right font-black text-green-700 text-sm">
                    {v.avg_efficiency_kmpl} km/L
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
