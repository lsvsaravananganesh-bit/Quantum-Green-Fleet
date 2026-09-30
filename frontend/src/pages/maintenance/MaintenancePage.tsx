import React, { useState, useEffect } from 'react';
import {
  Wrench, AlertTriangle, CheckCircle, Clock, ShieldAlert,
  Gauge, RefreshCw, Car, ChevronRight, Info, BatteryCharging
} from 'lucide-react';
import { maintenanceApi } from '../../services/api';

export default function MaintenancePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await maintenanceApi.getOverview();
      setData(res.data);
      if (res.data.vehicles?.length > 0) {
        setSelectedVehicle(res.data.vehicles[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch maintenance health data.');
    } finally {
      setLoading(false);
    }
  };

  const getDeteriorationBadge = (score: number) => {
    if (score < 35) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Healthy ({score}%)</span>;
    }
    if (score < 68) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Advisory ({score}%)</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Urgent Service ({score}%)</span>;
  };

  const getComponentStatusColor = (status: string) => {
    if (status === 'good') return 'bg-emerald-600 text-white';
    if (status === 'warning') return 'bg-amber-500 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 6: Fleet Health
            </span>
            <span className="text-xs text-gray-500">Predictive Telemetry Diagnostics</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Predictive Maintenance & Vehicle Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Wear degradation tracking, 10-trip rolling fuel efficiency residual deltas, and proactive service countdowns.
          </p>
        </div>

        <button
          onClick={fetchMaintenanceData}
          disabled={loading}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Statistical Disclaimer */}
      {data?.disclaimer && (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start gap-3 shadow-sm text-xs">
          <Info size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300 leading-relaxed">
            {data.disclaimer}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Fleet Overview Metrics */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Fleet Health Index</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{(100 - data.fleet_avg_deterioration_pct).toFixed(1)}%</p>
            <span className="text-[11px] text-emerald-600 font-medium">{data.fleet_avg_deterioration_pct}% avg deterioration</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Nominal / Healthy</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{data.healthy_count} Vehicles</p>
            <span className="text-[11px] text-gray-400 font-medium">Operating nominally</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Advisory Attention</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{data.advisory_count} Vehicles</p>
            <span className="text-[11px] text-gray-400 font-medium">Inspection due soon</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Urgent Service Needed</p>
            <p className="text-xl font-bold text-red-600 mt-1">{data.urgent_count} Vehicles</p>
            <span className="text-[11px] text-red-500 font-medium">Immediate depot recall</span>
          </div>
        </div>
      )}

      {/* Main Grid: Vehicles List + Detailed Vehicle Diagnostic Card */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicles List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Monitored Fleet Vehicles ({data.vehicles.length})</h3>
              <span className="text-xs text-gray-400">Click any vehicle to inspect diagnostics</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Odometer</th>
                    <th className="py-2.5 px-3">Rolling Fuel Delta</th>
                    <th className="py-2.5 px-3">Health Status</th>
                    <th className="py-2.5 px-3">Service In</th>
                    <th className="py-2.5 px-3">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.vehicles.map((v: any) => (
                    <tr
                      key={v.vehicle_id}
                      onClick={() => setSelectedVehicle(v)}
                      className={`cursor-pointer transition-colors ${
                        selectedVehicle?.vehicle_id === v.vehicle_id ? 'bg-emerald-50 font-semibold' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-900">{v.registration_number}</div>
                        <div className="text-[10px] text-gray-500 capitalize">{v.vehicle_type} ({v.fuel_type})</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{v.current_odometer_km.toLocaleString()} km</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold ${
                          v.rolling_fuel_efficiency_delta_pct > 10 ? 'text-red-600' : 'text-emerald-700'
                        }`}>
                          {v.rolling_fuel_efficiency_delta_pct > 0 ? '+' : ''}{v.rolling_fuel_efficiency_delta_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {getDeteriorationBadge(v.deterioration_score_pct)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">{v.service_countdown_km.toLocaleString()} km</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.service_countdown_days <= 7 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {v.service_countdown_days} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Vehicle Deep Diagnostic */}
          {selectedVehicle && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedVehicle.registration_number}</h3>
                  <p className="text-xs text-gray-500 capitalize">{selectedVehicle.vehicle_type} • {selectedVehicle.fuel_type}</p>
                </div>
                {getDeteriorationBadge(selectedVehicle.deterioration_score_pct)}
              </div>

              {/* Service Countdown Banner */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-emerald-700" />
                  <span className="text-gray-600 font-medium">Preventive Maintenance:</span>
                </div>
                <span className="font-bold text-gray-900">
                  {selectedVehicle.service_countdown_km} km ({selectedVehicle.service_countdown_days} days)
                </span>
              </div>

              {/* Component Health Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Subsystem Health Indices</h4>
                {selectedVehicle.components.map((c: any, cIdx: number) => (
                  <div key={cIdx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{c.component_name}</span>
                      <span className="font-mono font-bold text-gray-900">{c.health_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.health_pct > 70 ? 'bg-emerald-600' : (c.health_pct > 40 ? 'bg-amber-500' : 'bg-red-600')
                        }`}
                        style={{ width: `${c.health_pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 italic">{c.wear_factor_desc}</p>
                  </div>
                ))}
              </div>

              {/* Actionable Recommendations */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <h4 className="font-bold text-gray-700">Diagnostic Action Items</h4>
                <div className="space-y-1.5">
                  {selectedVehicle.recommended_actions.map((act: string, aIdx: number) => (
                    <div key={aIdx} className="p-2.5 bg-amber-50/60 rounded border border-amber-200/50 text-amber-950 flex items-start gap-2">
                      <Wrench size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
