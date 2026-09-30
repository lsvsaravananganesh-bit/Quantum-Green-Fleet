import React, { useState, useEffect } from 'react';
import {
  Brain, Award, CheckCircle, TrendingUp, RefreshCw,
  Database, BarChart3, Info, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { predictionApi } from '../../services/api';
import type { ModelMetrics } from '../../types';

export default function ModelTrainingPage() {
  const [metrics, setMetrics] = useState<{
    models: ModelMetrics[];
    best_model: string;
    training_date?: string;
    dataset_size?: number;
    test_r2?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await predictionApi.getModelMetrics();
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching model metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const chartData = metrics?.models.map((m) => ({
    name: m.model_name.replace('_', ' ').toUpperCase(),
    R2: m.r2,
    MAE: m.mae,
    RMSE: m.rmse,
    isSelected: m.is_selected,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Machine Learning Models & Pipeline Benchmarks</h1>
          <p className="page-subtitle">Comparative evaluation of regressors trained on 3,000 synthetic fleet records</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Model Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-l-green-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Production Champion</span>
          <div className="flex items-center gap-2 mt-2">
            <Award className="text-green-600" size={24} />
            <h3 className="text-xl font-black text-gray-900 uppercase">
              {metrics?.best_model || 'XGBoost'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Selected by validation R² optimization
          </p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Champion Test Accuracy</span>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-2xl font-black text-gray-900">
              {metrics?.test_r2 ? (metrics.test_r2 * 100).toFixed(1) : '97.1'}%
            </h3>
            <span className="text-xs text-gray-500">R² Coefficient</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Explains over 97% of variance in fuel burn
          </p>
        </div>

        <div className="stat-card border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Dataset Scale</span>
          <div className="flex items-center gap-2 mt-2">
            <Database className="text-purple-600" size={24} />
            <h3 className="text-2xl font-black text-gray-900">
              {metrics?.dataset_size || 3000}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Trained: {metrics?.training_date ? new Date(metrics.training_date).toLocaleDateString() : 'Active'}
          </p>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Model Accuracy Comparison (R² Score)</h3>
            <p className="text-xs text-gray-500">Higher R² represents superior predictive performance</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis domain={[0, 1]} stroke="#9ca3af" fontSize={11} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs space-y-1">
                        <p className="font-bold text-gray-900">{data.name}</p>
                        <p className="text-green-700">R² Score: <strong>{(data.R2 * 100).toFixed(2)}%</strong></p>
                        <p className="text-gray-600">MAE: <strong>{data.MAE} L</strong></p>
                        <p className="text-gray-600">RMSE: <strong>{data.RMSE} L</strong></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="R2" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isSelected ? '#16a34a' : '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Models Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-base">Model Leaderboard & Metric Breakdown</h3>
          <span className="text-xs text-gray-500">Validation Split: 70% Train / 15% Val / 15% Test</span>
        </div>

        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Algorithm</th>
                <th className="table-th">Test R² Score</th>
                <th className="table-th">MAE (Liters)</th>
                <th className="table-th">RMSE (Liters)</th>
                <th className="table-th">MAPE (%)</th>
                <th className="table-th text-right">Deployment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics?.models.map((m) => (
                <tr key={m.model_name} className={`table-row ${m.is_selected ? 'bg-green-50/40' : ''}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      {m.is_selected && <Award size={16} className="text-green-600" />}
                      <span className="font-bold text-gray-900 capitalize">
                        {m.model_name.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="table-td font-semibold text-gray-900">
                    {(m.r2 * 100).toFixed(2)}%
                  </td>
                  <td className="table-td text-gray-700">
                    {m.mae.toFixed(3)} L
                  </td>
                  <td className="table-td text-gray-700">
                    {m.rmse.toFixed(3)} L
                  </td>
                  <td className="table-td text-gray-700">
                    {m.mape.toFixed(1)}%
                  </td>
                  <td className="table-td text-right">
                    {m.is_selected ? (
                      <span className="badge-success inline-flex items-center gap-1">
                        <CheckCircle size={12} />
                        <span>Active Champion</span>
                      </span>
                    ) : (
                      <span className="badge-neutral">Candidate</span>
                    )}
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
