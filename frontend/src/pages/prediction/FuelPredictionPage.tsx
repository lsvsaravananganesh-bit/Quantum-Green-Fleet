import React, { useState } from 'react';
import {
  Fuel, DollarSign, Leaf, Gauge, Sparkles, AlertCircle,
  HelpCircle, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { predictionApi } from '../../services/api';
import type { PredictionRequest, PredictionResult } from '../../types';

const PRESETS = [
  {
    name: 'Long-Haul Heavy Truck',
    data: {
      vehicle_type: 'truck',
      fuel_type: 'diesel',
      engine_cc: 4500,
      weight_kg: 14000,
      vehicle_age: 3,
      distance_km: 550,
      avg_speed_kmh: 65,
      idle_time_min: 25,
      road_type: 'highway',
      traffic_condition: 'medium',
      temperature_c: 28,
      payload_kg: 8000,
    },
  },
  {
    name: 'City Delivery Van',
    data: {
      vehicle_type: 'van',
      fuel_type: 'diesel',
      engine_cc: 2200,
      weight_kg: 2400,
      vehicle_age: 2,
      distance_km: 85,
      avg_speed_kmh: 32,
      idle_time_min: 35,
      road_type: 'urban',
      traffic_condition: 'high',
      temperature_c: 32,
      payload_kg: 900,
    },
  },
  {
    name: 'Corporate Fleet Sedan',
    data: {
      vehicle_type: 'car',
      fuel_type: 'petrol',
      engine_cc: 1500,
      weight_kg: 1200,
      vehicle_age: 1,
      distance_km: 180,
      avg_speed_kmh: 75,
      idle_time_min: 8,
      road_type: 'highway',
      traffic_condition: 'low',
      temperature_c: 25,
      payload_kg: 120,
    },
  },
  {
    name: 'Urban Transit Bus',
    data: {
      vehicle_type: 'bus',
      fuel_type: 'diesel',
      engine_cc: 5600,
      weight_kg: 15000,
      vehicle_age: 5,
      distance_km: 140,
      avg_speed_kmh: 28,
      idle_time_min: 45,
      road_type: 'urban',
      traffic_condition: 'high',
      temperature_c: 30,
      payload_kg: 3500,
    },
  },
];

export default function FuelPredictionPage() {
  const [params, setParams] = useState<PredictionRequest>(PRESETS[0].data);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictionApi.predictFuel(params);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Inference failed. Verify model status.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetData: any) => {
    setParams(presetData);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">AI Fuel Consumption Predictor</h1>
          <p className="page-subtitle">Simulate trip conditions and infer fuel usage, cost, and CO₂ output using trained ML models</p>
        </div>
      </div>

      {/* Preset Quick Select */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
          <Sparkles size={14} className="text-green-600" /> Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p.data)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-green-500 hover:text-green-800 text-xs font-medium text-gray-700 transition-all flex-shrink-0"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 card">
          <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <span>Trip & Vehicle Specifications</span>
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            {/* Vehicle & Fuel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label">Vehicle Class</label>
                <select
                  value={params.vehicle_type}
                  onChange={(e) => setParams({ ...params, vehicle_type: e.target.value })}
                  className="select-field"
                >
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="car">Car</option>
                  <option value="bus">Bus</option>
                </select>
              </div>

              <div>
                <label className="label">Fuel Type</label>
                <select
                  value={params.fuel_type}
                  onChange={(e) => setParams({ ...params, fuel_type: e.target.value })}
                  className="select-field"
                >
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="label">Engine (CC)</label>
                <input
                  type="number"
                  value={params.engine_cc}
                  onChange={(e) => setParams({ ...params, engine_cc: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Vehicle Weight (kg)</label>
                <input
                  type="number"
                  value={params.weight_kg}
                  onChange={(e) => setParams({ ...params, weight_kg: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Distance & Age & Speed */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={params.distance_km}
                  onChange={(e) => setParams({ ...params, distance_km: parseFloat(e.target.value) || 0 })}
                  className="input-field font-semibold text-green-800"
                />
              </div>

              <div>
                <label className="label">Avg Speed (km/h)</label>
                <input
                  type="number"
                  value={params.avg_speed_kmh}
                  onChange={(e) => setParams({ ...params, avg_speed_kmh: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Idle Time (min)</label>
                <input
                  type="number"
                  value={params.idle_time_min}
                  onChange={(e) => setParams({ ...params, idle_time_min: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Vehicle Age (Years)</label>
                <input
                  type="number"
                  value={params.vehicle_age}
                  onChange={(e) => setParams({ ...params, vehicle_age: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Road & Traffic & Payload */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label">Road Type</label>
                <select
                  value={params.road_type}
                  onChange={(e) => setParams({ ...params, road_type: e.target.value })}
                  className="select-field"
                >
                  <option value="highway">Highway</option>
                  <option value="mixed">Mixed Arterial</option>
                  <option value="urban">Urban Stop-and-Go</option>
                </select>
              </div>

              <div>
                <label className="label">Traffic Level</label>
                <select
                  value={params.traffic_condition}
                  onChange={(e) => setParams({ ...params, traffic_condition: e.target.value })}
                  className="select-field"
                >
                  <option value="low">Low Traffic</option>
                  <option value="medium">Medium Traffic</option>
                  <option value="high">Heavy Congestion</option>
                </select>
              </div>

              <div>
                <label className="label">Cargo Payload (kg)</label>
                <input
                  type="number"
                  value={params.payload_kg}
                  onChange={(e) => setParams({ ...params, payload_kg: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Ambient Temp (°C)</label>
                <input
                  type="number"
                  value={params.temperature_c}
                  onChange={(e) => setParams({ ...params, temperature_c: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Run Fuel & Carbon Prediction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Outputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="card space-y-4 border-2 border-green-700/30">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">Model Inference</span>
                  <h3 className="font-bold text-gray-900 text-lg">Simulation Results</h3>
                </div>
                <span className="badge-success text-xs font-mono uppercase">{result.model_name}</span>
              </div>

              {/* Primary Output Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-green-50/70 rounded-xl border border-green-100">
                  <div className="flex items-center gap-1.5 text-xs text-green-800 font-semibold mb-1">
                    <Fuel size={16} />
                    <span>Fuel Required</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {result.predicted_fuel_liters} <span className="text-sm font-normal text-gray-600">Liters</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Range: [{result.confidence_lower} - {result.confidence_upper}] L
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-1.5 text-xs text-blue-800 font-semibold mb-1">
                    <Gauge size={16} />
                    <span>Expected Mileage</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {result.predicted_efficiency_kmpl} <span className="text-sm font-normal text-gray-600">km/L</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    For {result.distance_km} km journey
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold mb-1">
                    <DollarSign size={16} />
                    <span>Estimated Cost</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    ₹{result.predicted_cost_inr.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Based on market fuel prices
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-1">
                    <Leaf size={16} />
                    <span>Carbon Footprint</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-950">
                    {result.predicted_co2_kg} <span className="text-sm font-normal text-gray-600">kg CO₂</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Emissions compliance standard
                  </p>
                </div>
              </div>

              {/* Feature Importance Insight */}
              {result.feature_importance && result.feature_importance.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Key Influencing Factors (SHAP Gain)
                  </h4>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={result.feature_importance.slice(0, 5)}
                        margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="feature"
                          stroke="#6b7280"
                          fontSize={10}
                          tickFormatter={(f) => f.replace('_', ' ').slice(0, 12)}
                        />
                        <Tooltip />
                        <Bar dataKey="importance" fill="#16a34a" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Eco Driving Suggestions */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                <p className="font-semibold text-gray-800">💡 Green Driving Recommendations:</p>
                {params.idle_time_min > 20 && (
                  <p className="text-gray-600">• Reducing idling by 15 min can save approx {(params.idle_time_min * 0.05).toFixed(1)} L fuel.</p>
                )}
                {params.avg_speed_kmh > 75 && (
                  <p className="text-gray-600">• Lowering cruising speed to 65 km/h improves aerodynamic efficiency by ~8%.</p>
                )}
                <p className="text-gray-600">• Optimized tyre pressure maintenance yields an additional 0.3 - 0.5 km/L.</p>
              </div>
            </div>
          ) : (
            <div className="card h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 text-gray-400">
                <Fuel size={28} />
              </div>
              <h3 className="font-bold text-gray-700 text-sm">No Simulation Run Yet</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Configure vehicle specifications and route parameters on the left, then click "Run Fuel & Carbon Prediction"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
