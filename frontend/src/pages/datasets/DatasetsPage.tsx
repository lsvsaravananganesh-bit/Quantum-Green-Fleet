import React, { useState } from 'react';
import {
  Database, Download, Table, FileText, CheckCircle2,
  Filter, Sparkles, RefreshCw
} from 'lucide-react';

// Sample dataset preview matching datasets/fleet_fuel_data.csv schema
const SAMPLE_DATASET = [
  { id: 1, vehicle_type: 'truck', fuel_type: 'diesel', engine_cc: 4800, weight_kg: 14500, vehicle_age: 3, distance_km: 420.5, avg_speed_kmh: 62.4, idle_time_min: 22.0, road_type: 'highway', traffic_condition: 'medium', temperature_c: 29.5, payload_kg: 7500, fuel_consumed_liters: 142.8 },
  { id: 2, vehicle_type: 'van', fuel_type: 'diesel', engine_cc: 2200, weight_kg: 2400, vehicle_age: 2, distance_km: 85.0, avg_speed_kmh: 34.0, idle_time_min: 35.0, road_type: 'urban', traffic_condition: 'high', temperature_c: 31.0, payload_kg: 850, fuel_consumed_liters: 12.4 },
  { id: 3, vehicle_type: 'car', fuel_type: 'petrol', engine_cc: 1400, weight_kg: 1100, vehicle_age: 1, distance_km: 210.0, avg_speed_kmh: 74.0, idle_time_min: 10.0, road_type: 'highway', traffic_condition: 'low', temperature_c: 26.0, payload_kg: 150, fuel_consumed_liters: 11.2 },
  { id: 4, vehicle_type: 'bus', fuel_type: 'diesel', engine_cc: 5800, weight_kg: 16000, vehicle_age: 4, distance_km: 310.0, avg_speed_kmh: 48.0, idle_time_min: 40.0, road_type: 'mixed', traffic_condition: 'high', temperature_c: 32.5, payload_kg: 4200, fuel_consumed_liters: 128.5 },
  { id: 5, vehicle_type: 'truck', fuel_type: 'diesel', engine_cc: 5200, weight_kg: 18000, vehicle_age: 5, distance_km: 650.0, avg_speed_kmh: 58.0, idle_time_min: 30.0, road_type: 'highway', traffic_condition: 'medium', temperature_c: 28.0, payload_kg: 11000, fuel_consumed_liters: 248.6 },
  { id: 6, vehicle_type: 'van', fuel_type: 'petrol', engine_cc: 1600, weight_kg: 1800, vehicle_age: 3, distance_km: 120.0, avg_speed_kmh: 42.0, idle_time_min: 25.0, road_type: 'mixed', traffic_condition: 'medium', temperature_c: 27.0, payload_kg: 500, fuel_consumed_liters: 15.8 },
  { id: 7, vehicle_type: 'car', fuel_type: 'diesel', engine_cc: 2000, weight_kg: 1600, vehicle_age: 2, distance_km: 185.0, avg_speed_kmh: 68.0, idle_time_min: 12.0, road_type: 'highway', traffic_condition: 'low', temperature_c: 25.5, payload_kg: 200, fuel_consumed_liters: 13.5 },
  { id: 8, vehicle_type: 'truck', fuel_type: 'diesel', engine_cc: 4200, weight_kg: 12000, vehicle_age: 6, distance_km: 290.0, avg_speed_kmh: 52.0, idle_time_min: 28.0, road_type: 'mixed', traffic_condition: 'medium', temperature_c: 30.0, payload_kg: 6200, fuel_consumed_liters: 94.2 },
];

export default function DatasetsPage() {
  const [filterType, setFilterType] = useState('');

  const filtered = filterType
    ? SAMPLE_DATASET.filter((d) => d.vehicle_type === filterType)
    : SAMPLE_DATASET;

  const handleDownloadCSV = () => {
    const headers = Object.keys(SAMPLE_DATASET[0]).join(',');
    const rows = SAMPLE_DATASET.map((r) => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fleet_fuel_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Dataset Telemetry & Feature Repository</h1>
          <p className="page-subtitle">Inspect synthetic training data, feature distributions, and calibration sets</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5 shadow-sm"
        >
          <Download size={15} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Dataset Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-green-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Observations</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">3,000</h3>
          <p className="text-xs text-gray-500 mt-1">Simulated trips with physics calibration</p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Features Encoded</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">13 Columns</h3>
          <p className="text-xs text-gray-500 mt-1">9 numerical, 4 categorical</p>
        </div>

        <div className="stat-card border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Target Range</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">1.0 - 1382.3 L</h3>
          <p className="text-xs text-gray-500 mt-1">Fuel consumption target</p>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mean Fuel Burn</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">166.8 L</h3>
          <p className="text-xs text-gray-500 mt-1">Fleet journey baseline</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table size={16} className="text-green-700" />
            <h3 className="font-bold text-gray-900 text-sm">Telemetry Sample Explorer (fleet_fuel_data.csv)</h3>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field text-xs py-1 px-2.5 w-44"
          >
            <option value="">All Vehicles</option>
            <option value="truck">Trucks</option>
            <option value="van">Vans</option>
            <option value="car">Cars</option>
            <option value="bus">Buses</option>
          </select>
        </div>

        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Type / Fuel</th>
                <th className="table-th">Displacement</th>
                <th className="table-th">Weight (kg)</th>
                <th className="table-th">Distance (km)</th>
                <th className="table-th">Avg Speed</th>
                <th className="table-th">Idle (min)</th>
                <th className="table-th">Road / Traffic</th>
                <th className="table-th">Payload (kg)</th>
                <th className="table-th text-right font-black text-green-900">Fuel (L)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filtered.map((row) => (
                <tr key={row.id} className="table-row">
                  <td className="table-td font-mono text-gray-400">{row.id}</td>
                  <td className="table-td font-bold capitalize text-gray-900">
                    {row.vehicle_type} <span className="text-gray-400 font-normal">({row.fuel_type})</span>
                  </td>
                  <td className="table-td text-gray-600">{row.engine_cc} cc</td>
                  <td className="table-td text-gray-600">{row.weight_kg.toLocaleString()}</td>
                  <td className="table-td font-semibold text-gray-800">{row.distance_km}</td>
                  <td className="table-td text-gray-600">{row.avg_speed_kmh} km/h</td>
                  <td className="table-td text-gray-600">{row.idle_time_min}</td>
                  <td className="table-td capitalize text-gray-500">{row.road_type} • {row.traffic_condition}</td>
                  <td className="table-td text-gray-600">{row.payload_kg.toLocaleString()}</td>
                  <td className="table-td text-right font-black text-green-800 text-sm">
                    {row.fuel_consumed_liters} L
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
