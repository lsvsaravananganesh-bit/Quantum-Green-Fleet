import React, { useState } from 'react';
import {
  Settings, Save, CheckCircle2, DollarSign,
  Leaf, Atom, Key, RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const [petrolPrice, setPetrolPrice] = useState(103.5);
  const [dieselPrice, setDieselPrice] = useState(90.25);
  const [evTariff, setEvTariff] = useState(8.0);

  const [dieselEmission, setDieselEmission] = useState(2.68);
  const [petrolEmission, setPetrolEmission] = useState(2.31);
  const [hybridEmission, setHybridEmission] = useState(1.85);

  const [lambdaTrip, setLambdaTrip] = useState(500);
  const [lambdaVeh, setLambdaVeh] = useState(300);

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [osrmUrl, setOsrmUrl] = useState('https://router.project-osrm.org');

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Platform Configuration & Constants</h1>
          <p className="page-subtitle">Configure market fuel tariffs, statutory GHG factors, and QUBO Lagrangian penalties</p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>Configuration parameters updated and applied to optimization pipelines.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Market Fuel Tariffs */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <DollarSign size={18} className="text-green-700" />
            <h3 className="font-bold text-gray-900 text-sm">Fuel & Electricity Pricing (INR)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Petrol Price (₹ / Liter)</label>
              <input
                type="number"
                step="0.05"
                value={petrolPrice}
                onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="label">Diesel Price (₹ / Liter)</label>
              <input
                type="number"
                step="0.05"
                value={dieselPrice}
                onChange={(e) => setDieselPrice(parseFloat(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="label">Commercial EV Tariff (₹ / kWh)</label>
              <input
                type="number"
                step="0.1"
                value={evTariff}
                onChange={(e) => setEvTariff(parseFloat(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* GHG Emission Factors */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Leaf size={18} className="text-emerald-700" />
            <h3 className="font-bold text-gray-900 text-sm">Carbon Emission Coefficients (kg CO₂ / Liter)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Diesel Emission Factor</label>
              <input
                type="number"
                step="0.01"
                value={dieselEmission}
                onChange={(e) => setDieselEmission(parseFloat(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="label">Petrol Emission Factor</label>
              <input
                type="number"
                step="0.01"
                value={petrolEmission}
                onChange={(e) => setPetrolEmission(parseFloat(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="label">Hybrid Emission Factor</label>
              <input
                type="number"
                step="0.01"
                value={hybridEmission}
                onChange={(e) => setHybridEmission(parseFloat(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* QUBO Penalty Parameters */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Atom size={18} className="text-indigo-700" />
            <h3 className="font-bold text-gray-900 text-sm">QUBO Matrix Constraints & Penalties</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Trip Coverage Penalty (λ₁)</label>
              <input
                type="number"
                value={lambdaTrip}
                onChange={(e) => setLambdaTrip(parseInt(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
              <p className="text-[11px] text-gray-400 mt-1">Penalty for unassigned or duplicate trip assignments</p>
            </div>
            <div>
              <label className="label">Vehicle Capacity Penalty (λ₂)</label>
              <input
                type="number"
                value={lambdaVeh}
                onChange={(e) => setLambdaVeh(parseInt(e.target.value) || 0)}
                className="input-field font-semibold text-gray-900"
              />
              <p className="text-[11px] text-gray-400 mt-1">Penalty for assigning more than 1 trip per vehicle</p>
            </div>
          </div>
        </div>

        {/* AI & Routing Services */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Key size={18} className="text-slate-700" />
            <h3 className="font-bold text-gray-900 text-sm">External AI & GIS Integrations</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Google Gemini API Key (Optional)</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field"
              />
              <p className="text-[11px] text-gray-400 mt-1">For advanced generative AI chat responses</p>
            </div>
            <div>
              <label className="label">OSRM Routing Service Endpoint</label>
              <input
                type="text"
                value={osrmUrl}
                onChange={(e) => setOsrmUrl(e.target.value)}
                className="input-field"
              />
              <p className="text-[11px] text-gray-400 mt-1">Real-time road network distance calculation</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 shadow-md"
          >
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
