import React, { useState, useEffect } from 'react';
import {
  BatteryCharging, Zap, DollarSign, Thermometer, RefreshCw,
  AlertTriangle, ShieldCheck, CheckCircle, BarChart2, TrendingDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { evApi } from '../../services/api';

export default function EVFleetPage() {
  const [loading, setLoading] = useState(false);
  const [ambientTemp, setAmbientTemp] = useState<number>(28);
  const [gridFactor, setGridFactor] = useState<number>(420);
  const [report, setReport] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEVReport();
  }, []);

  const fetchEVReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await evApi.getFleetReport({
        ambient_temp_c: ambientTemp,
        grid_emission_factor_g_kwh: gridFactor,
      });
      setReport(res.data);
      if (res.data.vehicle_schedules?.length > 0) {
        setSelectedVehicle(res.data.vehicle_schedules[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch EV fleet analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare TCO chart data
  const tcoChartData = [
    {
      horizon: 'Year 1',
      ICE: report?.tco_summary?.find((t: any) => t.powertrain === 'Diesel ICE' && t.year_horizon === 1)?.total_tco_inr || 0,
      PHEV: report?.tco_summary?.find((t: any) => t.powertrain === 'Plug-in Hybrid (PHEV)' && t.year_horizon === 1)?.total_tco_inr || 0,
      BEV: report?.tco_summary?.find((t: any) => t.powertrain === 'Battery Electric (BEV)' && t.year_horizon === 1)?.total_tco_inr || 0,
    },
    {
      horizon: 'Year 3',
      ICE: report?.tco_summary?.find((t: any) => t.powertrain === 'Diesel ICE' && t.year_horizon === 3)?.total_tco_inr || 0,
      PHEV: report?.tco_summary?.find((t: any) => t.powertrain === 'Plug-in Hybrid (PHEV)' && t.year_horizon === 3)?.total_tco_inr || 0,
      BEV: report?.tco_summary?.find((t: any) => t.powertrain === 'Battery Electric (BEV)' && t.year_horizon === 3)?.total_tco_inr || 0,
    },
    {
      horizon: 'Year 5',
      ICE: report?.tco_summary?.find((t: any) => t.powertrain === 'Diesel ICE' && t.year_horizon === 5)?.total_tco_inr || 0,
      PHEV: report?.tco_summary?.find((t: any) => t.powertrain === 'Plug-in Hybrid (PHEV)' && t.year_horizon === 5)?.total_tco_inr || 0,
      BEV: report?.tco_summary?.find((t: any) => t.powertrain === 'Battery Electric (BEV)' && t.year_horizon === 5)?.total_tco_inr || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 8: Electrification Engine
            </span>
            <span className="text-xs text-gray-500">Smart Charging & Dual Accounting</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Electric & Hybrid Fleet Optimization</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Off-peak ToU charging schedule optimization, thermal range derating, and multi-year lifecycle TCO models.
          </p>
        </div>

        <button
          onClick={fetchEVReport}
          disabled={loading}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Re-evaluate Fleet</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Environmental & Grid Settings Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Environmental & Grid Carbon Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Thermometer size={14} className="text-amber-600" />
                Ambient Temperature
              </span>
              <span className="font-mono font-bold text-gray-900">{ambientTemp}°C</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
              onMouseUp={fetchEVReport}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {ambientTemp < 15 ? 'Cold temperature: internal battery resistance increases range drag.' : (ambientTemp > 32 ? 'Extreme heat: cabin HVAC cooling increases battery draw.' : 'Optimal operating window (20-26°C).')}
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-700" />
                Grid Carbon Intensity
              </span>
              <span className="font-mono font-bold text-gray-900">{gridFactor} g CO₂/kWh</span>
            </div>
            <input
              type="range"
              min="150"
              max="800"
              step="25"
              value={gridFactor}
              onChange={(e) => setGridFactor(parseInt(e.target.value))}
              onMouseUp={fetchEVReport}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              National grid average: ~420 g/kWh; Green solar-backed depot tariff: ~180 g/kWh.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">EVs in Charging Queue</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{report.total_evs_managed} Vehicles</p>
            <span className="text-[11px] text-emerald-600 font-medium">100% active sessions</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Scheduled Energy</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{report.total_energy_required_kwh} kWh</p>
            <span className="text-[11px] text-gray-400 font-medium">Target 85% battery SoC</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Off-Peak ToU Savings</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">₹{report.total_off_peak_savings_inr.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600 font-medium">vs flat peak tariff</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Grid Carbon Scope 2</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {((report.total_energy_required_kwh * gridFactor) / 1000).toFixed(1)} kg CO2
            </p>
            <span className="text-[11px] text-gray-400 font-medium">Depot electricity indirect</span>
          </div>
        </div>
      )}

      {/* Smart Charging Scheduler & Schedule Inspector */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active EV Charging List */}
          <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Active EV Charging Sessions</h3>

            <div className="space-y-2.5">
              {report.vehicle_schedules.map((ev: any) => (
                <div
                  key={ev.vehicle_id}
                  onClick={() => setSelectedVehicle(ev)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedVehicle?.vehicle_id === ev.vehicle_id
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{ev.registration_number}</span>
                    <span className="font-semibold text-emerald-700 font-mono">₹{ev.total_charging_cost_inr}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5">
                    <span>SoC: {ev.current_soc_pct}% → {ev.target_soc_pct}%</span>
                    <span>Departure: 07:30 AM</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${ev.target_soc_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time-of-Use Hourly Charging Slots */}
          {selectedVehicle && (
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    Smart Hourly Charging Schedule: {selectedVehicle.registration_number}
                  </h3>
                  <p className="text-xs text-gray-400">Allocated to lowest tariff windows prior to departure</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedVehicle.charging_duration_hr} Hours Fast Charging
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Time Window</th>
                      <th className="py-2.5 px-3">Tariff Tier</th>
                      <th className="py-2.5 px-3">Rate (INR/kWh)</th>
                      <th className="py-2.5 px-3">Energy Drawn</th>
                      <th className="py-2.5 px-3">Slot Cost</th>
                      <th className="py-2.5 px-3">End Battery SoC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedVehicle.schedule_slots.map((slot: any, sIdx: number) => (
                      <tr key={sIdx} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-3 font-mono font-medium text-gray-800">{slot.hour_slot}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            slot.tariff_tier === 'Off-Peak' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {slot.tariff_tier}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">₹{slot.rate_per_kwh_inr.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">{slot.energy_charged_kwh} kWh</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-medium">₹{slot.cost_inr.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{slot.soc_at_end_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Year TCO Comparison Table and Bar Chart */}
      {report && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Total Cost of Ownership (TCO) Projection (1, 3, 5 Years)</h3>
              <p className="text-xs text-gray-400">Capital + Energy + Maintenance + Scope 1/2 Carbon Accounting</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcoChartData} margin={{ top: 10, right: 10, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="horizon" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="ICE" name="Diesel ICE" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PHEV" name="Plug-in Hybrid" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="BEV" name="Battery Electric (BEV)" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Powertrain</th>
                  <th className="py-2.5 px-3">Horizon</th>
                  <th className="py-2.5 px-3">Capital Asset</th>
                  <th className="py-2.5 px-3">Energy / Fuel</th>
                  <th className="py-2.5 px-3">Maintenance</th>
                  <th className="py-2.5 px-3">Carbon Tax</th>
                  <th className="py-2.5 px-3">Total TCO</th>
                  <th className="py-2.5 px-3">Per KM Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.tco_summary.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{t.powertrain}</td>
                    <td className="py-2.5 px-3">{t.year_horizon} Year{t.year_horizon > 1 ? 's' : ''}</td>
                    <td className="py-2.5 px-3">₹{t.capital_cost_inr.toLocaleString()}</td>
                    <td className="py-2.5 px-3">₹{t.energy_cost_inr.toLocaleString()}</td>
                    <td className="py-2.5 px-3">₹{t.maintenance_cost_inr.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-500">₹{t.carbon_tax_cost_inr.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">₹{t.total_tco_inr.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono">₹{t.cost_per_km_inr} / km</td>
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
