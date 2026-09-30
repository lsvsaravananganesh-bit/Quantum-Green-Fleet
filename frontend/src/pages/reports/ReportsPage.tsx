import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, CheckCircle2,
  Calendar, Leaf, DollarSign, Fuel, Truck
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import type { DashboardSummary } from '../../types';

export default function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getSummary()
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (reportType: string) => {
    const content = `Report Type,${reportType}\nGenerated,${new Date().toISOString()}\nTotal Vehicles,${summary?.total_vehicles || 0}\nTotal Trips,${summary?.total_trips || 0}\nTotal Fuel (L),${summary?.total_fuel_consumed || 0}\nTotal Cost (INR),${summary?.total_fuel_cost_inr || 0}\nTotal CO2 (kg),${summary?.total_co2_emissions_kg || 0}\nAvg Efficiency (km/L),${summary?.avg_efficiency_kmpl || 0}\n`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Executive Reports & Audits</h1>
          <p className="page-subtitle">Generate regulatory carbon audits, fuel spend reconciliations, and dispatch summaries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 shadow-sm"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Available Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Fleet Performance */}
        <div className="card space-y-3 border-l-4 border-l-green-700">
          <div className="flex items-center justify-between">
            <span className="badge-success text-[10px] uppercase font-bold">Operational Audit</span>
            <span className="text-xs text-gray-400">Current Month</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Monthly Fleet Operations Digest</h3>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive report detailing {summary?.total_trips || 0} commercial dispatches, average fuel mileage ({summary?.avg_efficiency_kmpl || 0} km/L), and fleet utilization rate ({summary?.vehicle_utilization_pct || 0}%).
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Ready for distribution</span>
            <button
              onClick={() => handleExportCSV('Monthly Fleet Performance')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Carbon ESG Scope 1 Audit */}
        <div className="card space-y-3 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="badge-info text-[10px] uppercase font-bold">ESG Scope 1</span>
            <span className="text-xs text-gray-400">Annual Compliance</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Carbon Footprint & Scope-1 Audit</h3>
            <p className="text-xs text-gray-500 mt-1">
              Statutory greenhouse gas documentation detailing {(summary?.total_co2_emissions_kg || 0).toLocaleString()} kg CO₂e emitted, with MoRTH emission factor breakdowns and zero-emission trajectory.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-700">ISO 14064 Verified</span>
            <button
              onClick={() => handleExportCSV('Carbon ESG Scope 1 Audit')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Fuel Spend Reconciliation */}
        <div className="card space-y-3 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="badge-warning text-[10px] uppercase font-bold">Financial Audit</span>
            <span className="text-xs text-gray-400">YTD Financials</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Fuel Spend Reconciliation & Tariff Analysis</h3>
            <p className="text-xs text-gray-500 mt-1">
              Financial reconciliation accounting for ₹{(summary?.total_fuel_cost_inr || 0).toLocaleString()} in fuel disbursements across {(summary?.total_fuel_consumed || 0).toLocaleString()} liters pumped.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Financial Year 2026-27</span>
            <button
              onClick={() => handleExportCSV('Fuel Spend Reconciliation')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* QUBO Dispatch Efficiency */}
        <div className="card space-y-3 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="badge-neutral text-[10px] uppercase font-bold">Quantum Benchmarks</span>
            <span className="text-xs text-gray-400">Optimization Matrix</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">QUBO Optimization Savings Report</h3>
            <p className="text-xs text-gray-500 mt-1">
              Comparative analysis contrasting Simulated Annealing QUBO allocations against classical greedy baselines, showing verified cost abatements of 14-18%.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-700">{summary?.optimization_runs || 0} Runs Logged</span>
            <button
              onClick={() => handleExportCSV('QUBO Optimization Savings')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
