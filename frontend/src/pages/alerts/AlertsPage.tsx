import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, CheckCircle2, ShieldAlert,
  Info, Filter, Check, RefreshCw
} from 'lucide-react';
import { alertsApi } from '../../services/api';
import type { Alert } from '../../types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertsApi.getAlerts({
        severity: severityFilter || undefined,
        is_read: statusFilter === 'unread' ? 0 : statusFilter === 'read' ? 1 : undefined,
      });
      setAlerts(res.data.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleMarkRead = async (id: number) => {
    try {
      await alertsApi.markRead(id);
      fetchAlerts();
    } catch (err) {
      console.error('Error marking alert read:', err);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertsApi.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Fleet Alerts & Anomaly Notifications</h1>
          <p className="page-subtitle">Real-time alerts for excessive fuel burn, service intervals, and missing logs</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 card p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSeverityFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              severityFilter === '' ? 'bg-green-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Severities
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              severityFilter === 'critical' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              severityFilter === 'warning' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => setSeverityFilter('info')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              severityFilter === 'info' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Informational
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field text-xs py-1.5 w-36"
        >
          <option value="">All Statuses</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read</option>
        </select>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center py-12 text-sm text-gray-400">Loading alerts feed...</div>
        ) : alerts.length === 0 ? (
          <div className="card text-center py-12 text-sm text-gray-400">No alerts match selected filters</div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`card p-4 transition-all flex items-start gap-4 ${
                !a.is_read ? 'border-l-4 border-l-green-700 bg-white' : 'opacity-75 bg-gray-50/60'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 ${
                  a.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : a.severity === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {a.severity === 'critical' ? (
                  <ShieldAlert size={20} />
                ) : a.severity === 'warning' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Info size={20} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      a.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : a.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-xs text-gray-400">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : 'Recent'}
                  </span>
                  {a.is_resolved && (
                    <span className="badge-success text-[10px]">Resolved</span>
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-900 leading-snug">{a.message}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!a.is_read && (
                  <button
                    onClick={() => handleMarkRead(a.id)}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 font-medium"
                  >
                    Mark Read
                  </button>
                )}
                {!a.is_resolved && (
                  <button
                    onClick={() => handleResolve(a.id)}
                    className="px-2.5 py-1 text-xs bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Check size={13} />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
