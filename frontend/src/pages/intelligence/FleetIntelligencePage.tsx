import React, { useState, useEffect } from 'react';
import {
  Compass, ShieldAlert, Award, ArrowRight, RefreshCw, AlertTriangle,
  CheckCircle, MapPin, Truck, Fuel, DollarSign, Gauge, TrendingUp, Zap
} from 'lucide-react';
import { intelligenceApi } from '../../services/api';

export default function FleetIntelligencePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await intelligenceApi.getOverview();
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load fleet intelligence overview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Master Status Ticker */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Module 10 & 11: Executive Intelligence
              </span>
              <span className="text-xs text-gray-500">Multi-Depot & Anomaly Cockpit</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Fleet Intelligence & Multi-Depot Operations</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hub inventory rebalancing, statistical IQR fuel anomaly detection, and driver eco-coaching leaderboards.
            </p>
          </div>

          <button
            onClick={fetchIntelligenceData}
            disabled={loading}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Intelligence Feed</span>
          </button>
        </div>

        {/* Executive Cockpit Ticker Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center gap-2.5">
            <Zap size={16} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px]">Active Quantum Solver</p>
              <p className="font-bold text-white">Transverse SQA + QUBO</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center gap-2.5">
            <Gauge size={16} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px]">Production Champion Model</p>
              <p className="font-bold text-white">XGBoost v1.0 (R²=0.971)</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center gap-2.5">
            <Award size={16} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px]">Fleet Eco-Driving Score</p>
              <p className="font-bold text-white">{data?.fleet_eco_average || 78.5} / 100</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px]">Active Fuel Anomalies</p>
              <p className="font-bold text-white">{data?.anomalies_detected_count || 0} Flagged</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Multi-Depot Operations & Network Rebalancing */}
      {data && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-emerald-700" />
              <h3 className="text-sm font-bold text-gray-800">Regional Distribution Hubs & Fleet Allocation</h3>
            </div>
            <span className="text-xs text-gray-500">{data.depots.length} Distribution Hubs Managed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.depots.map((depot: any) => (
              <div key={depot.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm truncate">{depot.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    depot.balance_status === 'Balanced'
                      ? 'bg-emerald-100 text-emerald-800'
                      : (depot.balance_status === 'Surplus' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {depot.balance_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-400">Assigned Fleet</span>
                    <p className="font-bold text-gray-800">{depot.assigned_vehicles_count} Vehicles</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Active Demand</span>
                    <p className="font-bold text-gray-800">{depot.active_deliveries_count} Deliveries</p>
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-gray-100 text-[11px] text-gray-600 space-y-0.5">
                  <span className="font-semibold text-gray-700">Rebalance Transfer:</span>
                  <p className="text-emerald-800 font-medium">{depot.recommended_transfer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuel Anomaly Detection Section (IQR / Z-Score Filter) */}
      {data && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel size={18} className="text-amber-600" />
              <h3 className="text-sm font-bold text-gray-800">
                Statistical Fuel Anomaly Detection (IQR & Z-Score Filter)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700">
              {data.fuel_anomalies.length} Suspicious Fuel Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Trip Code</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Driver</th>
                  <th className="py-2.5 px-3">Actual Fuel</th>
                  <th className="py-2.5 px-3">Expected (ML)</th>
                  <th className="py-2.5 px-3">Discrepancy</th>
                  <th className="py-2.5 px-3">Z-Score</th>
                  <th className="py-2.5 px-3">Statistical Outlier Type</th>
                  <th className="py-2.5 px-3">Suspected Root Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.fuel_anomalies.map((anom: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">{anom.trip_code}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-800">{anom.vehicle_reg}</td>
                    <td className="py-2.5 px-3">{anom.driver_name}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600">{anom.actual_fuel_liters} L</td>
                    <td className="py-2.5 px-3 text-gray-500">{anom.expected_fuel_liters} L</td>
                    <td className="py-2.5 px-3 font-bold text-red-700">
                      +{anom.excess_liters} L (+{anom.excess_pct}%)
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{anom.z_score}σ</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                        {anom.iqr_outlier_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-amber-900 bg-amber-50/50 rounded">
                      {anom.suspected_cause}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Eco-Scoring Leaderboard */}
      {data && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-emerald-700" />
              <h3 className="text-sm font-bold text-gray-800">Driver Eco-Driving Leaderboard & Coaching System</h3>
            </div>
            <span className="text-xs text-gray-500">Ranked by overall eco-score</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">Trips</th>
                  <th className="py-2.5 px-3">Eco-Score</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Idling Time</th>
                  <th className="py-2.5 px-3">Speed Adherence</th>
                  <th className="py-2.5 px-3">Fuel Delta vs Target</th>
                  <th className="py-2.5 px-3">Carbon Abated</th>
                  <th className="py-2.5 px-3">Coaching Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.driver_scores.map((d: any) => (
                  <tr key={d.driver_id} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{d.driver_name}</td>
                    <td className="py-2.5 px-3">{d.total_trips} trips</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800 font-mono text-sm">{d.eco_score}/100</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.eco_tier === 'Elite Eco-Driver'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (d.eco_tier === 'Efficient Operator' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {d.eco_tier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{d.idling_time_pct}%</td>
                    <td className="py-2.5 px-3 font-mono">{d.avg_speed_kmh} km/h</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono font-bold ${d.fuel_saved_vs_ml_target_liters >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {d.fuel_saved_vs_ml_target_liters > 0 ? '+' : ''}{d.fuel_saved_vs_ml_target_liters} L
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{d.co2_abated_kg} kg</td>
                    <td className="py-2.5 px-3 text-gray-600 max-w-xs">
                      {d.coaching_tips[0]}
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
