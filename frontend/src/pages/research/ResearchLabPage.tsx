import React, { useState } from 'react';
import {
  FileText, Download, Copy, Play, CheckCircle, RefreshCw,
  AlertTriangle, BookOpen, Layers, Atom, Info, Check
} from 'lucide-react';
import { researchApi } from '../../services/api';

export default function ResearchLabPage() {
  const [loading, setLoading] = useState(false);
  const [experimentTitle, setExperimentTitle] = useState(
    'Quantum-Inspired vs Classical Algorithms for Multi-Constrained Green Fleet Routing'
  );
  const [numSeeds, setNumSeeds] = useState<number>(5);
  const [experimentResult, setExperimentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'csv' | 'json'>('report');
  const [error, setError] = useState<string | null>(null);

  const handleRunExperiment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await researchApi.runExperiment(experimentTitle, numSeeds);
      setExperimentResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to execute scientific validation experiment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!experimentResult?.csv_export) return;
    const blob = new Blob([experimentResult.csv_export], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_benchmark_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!experimentResult) return;
    const blob = new Blob([JSON.stringify(experimentResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    if (!experimentResult?.scientific_markdown_report) return;
    navigator.clipboard.writeText(experimentResult.scientific_markdown_report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 12: Research Validation
            </span>
            <span className="text-xs text-gray-500">Reproducible Scientific Reporting</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Research Validation & Scientific Reporting</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automated multi-seed experiment runner with LaTeX-grounded academic reporting, CSV tabular data, and full JSON artifacts.
          </p>
        </div>

        <button
          onClick={handleRunExperiment}
          disabled={loading}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
          <span>Execute Validation Run</span>
        </button>
      </div>

      {/* Scientific Integrity Disclaimer */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start gap-3 shadow-sm text-xs">
        <Info size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-slate-300 leading-relaxed">
          <strong>Academic Reproducibility Assurance:</strong> All benchmark experiments are deterministic and seeded. Quantum-inspired algorithms operate via simulated annealing and tunneling dynamics on digital CPUs. Results demonstrate empirical convergence without unjustified physical quantum supremacy assertions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Experiment Setup Form */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Experiment Configuration</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold text-gray-700 mb-1 block">Experiment Study Title</label>
            <input
              type="text"
              value={experimentTitle}
              onChange={(e) => setExperimentTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Independent Random Seeds</label>
            <select
              value={numSeeds}
              onChange={(e) => setNumSeeds(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="3">3 Seeds (Rapid Verification)</option>
              <option value="5">5 Seeds (Standard Academic Practice)</option>
              <option value="10">10 Seeds (Publication Grade Dispersion)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Experiment Results Container */}
      {experimentResult && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Action & Tab Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'report' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Scientific Report (Markdown)
              </button>
              <button
                onClick={() => setActiveTab('csv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'csv' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Benchmark CSV Data
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'json' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Raw JSON Schema
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Report'}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Tab View Content */}
          <div className="p-6">
            {activeTab === 'report' && (
              <div className="prose prose-sm max-w-none text-xs text-gray-800 font-mono whitespace-pre-wrap bg-gray-50 p-5 rounded-lg border border-gray-200 overflow-x-auto leading-relaxed">
                {experimentResult.scientific_markdown_report}
              </div>
            )}

            {activeTab === 'csv' && (
              <div className="text-xs text-gray-800 font-mono whitespace-pre bg-gray-50 p-5 rounded-lg border border-gray-200 overflow-x-auto">
                {experimentResult.csv_export}
              </div>
            )}

            {activeTab === 'json' && (
              <div className="text-xs text-emerald-900 font-mono whitespace-pre bg-gray-50 p-5 rounded-lg border border-gray-200 overflow-x-auto">
                {JSON.stringify(experimentResult, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
