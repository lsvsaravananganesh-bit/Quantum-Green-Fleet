import React, { useState, useEffect } from 'react';
import {
  Brain, AlertTriangle, CheckCircle, RefreshCw, ArrowUpRight,
  TrendingDown, ShieldAlert, Award, RotateCcw, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { mlDriftApi } from '../../services/api';

export default function MLMonitorPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDriftReport();
  }, []);

  const fetchDriftReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mlDriftApi.getReport();
      setReport(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch ML drift report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (versionId: string) => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await mlDriftApi.promoteModel(versionId);
      setActionMessage(res.data.message);
      fetchDriftReport();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Model promotion rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await mlDriftApi.rollbackModel();
      setActionMessage(res.data.message);
      fetchDriftReport();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Rollback failed.');
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
              Module 9: Continual Learning
            </span>
            <span className="text-xs text-gray-500">ML Drift & Registry Supervisor</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Adaptive Machine Learning & Model Drift</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time inference residual tracking, Population Stability Index (PSI) drift alarms, and gated Champion/Challenger promotion.
          </p>
        </div>

        <button
          onClick={fetchDriftReport}
          disabled={loading}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Drift Telemetry</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Drift Status Banner */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Drift Severity Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              {report.drift_severity === 'Normal' && (
                <>
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span className="text-base font-bold text-emerald-700">Nominal Calibration</span>
                </>
              )}
              {report.drift_severity === 'Warning' && (
                <>
                  <AlertTriangle size={18} className="text-amber-600" />
                  <span className="text-base font-bold text-amber-700">Moderate Drift Warning</span>
                </>
              )}
              {report.drift_severity === 'Critical' && (
                <>
                  <ShieldAlert size={18} className="text-red-600" />
                  <span className="text-base font-bold text-red-700">Critical Drift Trigger</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">{report.total_trips_monitored} trips in inference window</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Rolling 20-Trip MAE</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{report.rolling_mae_20} L</p>
            <span className={`text-[11px] font-semibold ${
              report.mae_drift_pct > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {report.mae_drift_pct > 0 ? '+' : ''}{report.mae_drift_pct}% vs baseline
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Training Baseline MAE</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{report.baseline_mae} L</p>
            <span className="text-[11px] text-gray-400 font-medium">Champion model validation</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Active Champion Model</p>
            <p className="text-sm font-bold text-gray-900 mt-1 truncate">{report.active_champion.model_name}</p>
            <span className="text-[11px] text-emerald-600 font-medium">R² = {report.active_champion.r2_score}</span>
          </div>
        </div>
      )}

      {/* Feature Drift (PSI) & Residual Plot Grid */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PSI Indicators Table */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Population Stability Index (PSI) by Feature</h3>
                <p className="text-xs text-gray-400">Baseline training distribution vs Live production inputs</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Inference Feature</th>
                    <th className="py-2.5 px-3">PSI Metric</th>
                    <th className="py-2.5 px-3">Baseline Mean</th>
                    <th className="py-2.5 px-3">Live Mean</th>
                    <th className="py-2.5 px-3">Drift State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.psi_metrics.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/60">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{p.feature_name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{p.psi_value}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-500">{p.baseline_mean.toFixed(1)}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-800">{p.current_mean.toFixed(1)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.drift_status === 'No Drift'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (p.drift_status === 'Moderate Drift' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                        }`}>
                          {p.drift_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-gray-500 p-2.5 bg-gray-50 rounded border border-gray-100">
              PSI &lt; 0.10: Stable distribution; PSI 0.10-0.25: Moderate shift; PSI &gt; 0.25: Significant drift requiring retraining.
            </div>
          </div>

          {/* Residual Tracking Line Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Inference Residual Trajectory (y_actual - y_pred)</h3>
                <p className="text-xs text-gray-400">Error divergence over 50 monitored production trips</p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.residual_distribution} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="trip_idx" stroke="#94a3b8" fontSize={11} label={{ value: 'Trip Index', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}L`} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-emerald-400">Trip #{d.trip_idx}</p>
                            <p>Residual: {d.residual_liters > 0 ? '+' : ''}{d.residual_liters} Liters</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="residual_liters" stroke="#047857" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Model Registry Champion/Challenger Framework */}
      {report && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Model Registry (Champion / Challenger Framework)</h3>
              <p className="text-xs text-gray-400">Gated promotion enforces zero validation regression on slice benchmarks</p>
            </div>

            <button
              onClick={handleRollback}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Rollback to Previous</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Model Version</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">R² Score</th>
                  <th className="py-2.5 px-3">MAE (Liters)</th>
                  <th className="py-2.5 px-3">RMSE</th>
                  <th className="py-2.5 px-3">Training Set</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Active Champion */}
                <tr className="bg-emerald-50/40">
                  <td className="py-2.5 px-3 font-bold text-gray-900">{report.active_champion.model_name}</td>
                  <td className="py-2.5 px-3 capitalize font-mono">{report.active_champion.algorithm}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 w-fit">
                      <Award size={12} /> Active Champion
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-800">{report.active_champion.r2_score}</td>
                  <td className="py-2.5 px-3 font-mono">{report.active_champion.mae_liters} L</td>
                  <td className="py-2.5 px-3 font-mono">{report.active_champion.rmse_liters} L</td>
                  <td className="py-2.5 px-3">{report.active_champion.training_samples} samples</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-medium">Live In Production</td>
                </tr>

                {/* Challengers */}
                {report.available_challengers.map((c: any) => (
                  <tr key={c.version_id} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{c.model_name}</td>
                    <td className="py-2.5 px-3 capitalize font-mono">{c.algorithm}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.status === 'Challenger' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{c.r2_score}</td>
                    <td className="py-2.5 px-3 font-mono">{c.mae_liters} L</td>
                    <td className="py-2.5 px-3 font-mono">{c.rmse_liters} L</td>
                    <td className="py-2.5 px-3">{c.training_samples} samples</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handlePromote(c.version_id)}
                        disabled={loading}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors"
                      >
                        Promote to Champion
                      </button>
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
