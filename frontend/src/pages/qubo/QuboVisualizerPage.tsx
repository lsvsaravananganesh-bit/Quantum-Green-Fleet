import React, { useState, useEffect } from 'react';
import {
  Grid, Sliders, CheckCircle, AlertTriangle, Atom, Info,
  RefreshCw, Layers, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { researchApi } from '../../services/api';

export default function QuboVisualizerPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic penalty sliders
  const [multipliers, setMultipliers] = useState({
    lambda1: 500.0,
    lambda2: 200.0,
    lambda3: 1000.0,
    alpha: 0.6,
    beta: 0.4,
  });

  // Current active bitstring state
  const [bitstring, setBitstring] = useState<string>('');

  useEffect(() => {
    fetchQuboMatrix();
  }, []);

  const fetchQuboMatrix = async (customBitstring?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await researchApi.inspectQubo({
        lambda1: multipliers.lambda1,
        lambda2: multipliers.lambda2,
        lambda3: multipliers.lambda3,
        alpha: multipliers.alpha,
        beta: multipliers.beta,
        candidate_bitstring: customBitstring || bitstring || undefined,
      });
      setAnalysis(res.data);
      if (!bitstring || customBitstring) {
        setBitstring(res.data.default_energy_decomposition.bitstring);
      }
      if (res.data.cells?.length > 0 && !selectedCell) {
        setSelectedCell(res.data.cells[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to inspect QUBO matrix.');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (key: string, val: number) => {
    setMultipliers((prev) => ({ ...prev, [key]: val }));
  };

  const handleApplyMultipliers = () => {
    fetchQuboMatrix();
  };

  const toggleBit = (index: number) => {
    if (!bitstring) return;
    const chars = bitstring.split('');
    chars[index] = chars[index] === '1' ? '0' : '1';
    const newBitstring = chars.join('');
    setBitstring(newBitstring);
    fetchQuboMatrix(newBitstring);
  };

  const getCellColor = (val: number, isDiag: boolean) => {
    if (val === 0) return 'bg-gray-100 text-gray-400';
    if (isDiag) {
      return val < 0 ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-amber-100 text-amber-900 border-amber-200';
    }
    // Couplings
    return val > 0 ? 'bg-rose-100 text-rose-900 border-rose-200' : 'bg-emerald-100 text-emerald-900 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Module 4: Quantum Explorer
            </span>
            <span className="text-xs text-gray-500">Hamiltonian Matrix Inspector</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">QUBO Visualizer & Formulation Explorer</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Interactive coefficient heatmap distinguishing diagonal linear biases from off-diagonal quadratic penalty couplers.
          </p>
        </div>

        <button
          onClick={handleApplyMultipliers}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Recompute QUBO</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Penalty Multiplier Sliders */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-emerald-700" />
            <h3 className="text-sm font-bold text-gray-800">Dynamic Lagrange Multipliers & Objective Weights</h3>
          </div>
          <button
            onClick={handleApplyMultipliers}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
          >
            Apply Changes
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">λ₁ Coverage Penalty</span>
              <span className="font-mono text-emerald-700 font-bold">{multipliers.lambda1}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={multipliers.lambda1}
              onChange={(e) => handleSliderChange('lambda1', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">λ₂ Reuse Penalty</span>
              <span className="font-mono text-emerald-700 font-bold">{multipliers.lambda2}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={multipliers.lambda2}
              onChange={(e) => handleSliderChange('lambda2', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">λ₃ Availability</span>
              <span className="font-mono text-emerald-700 font-bold">{multipliers.lambda3}</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="100"
              value={multipliers.lambda3}
              onChange={(e) => handleSliderChange('lambda3', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">α Fuel Cost Weight</span>
              <span className="font-mono text-emerald-700 font-bold">{multipliers.alpha}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={multipliers.alpha}
              onChange={(e) => handleSliderChange('alpha', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">β Emission Weight</span>
              <span className="font-mono text-emerald-700 font-bold">{multipliers.beta}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={multipliers.beta}
              onChange={(e) => handleSliderChange('beta', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Energy Decomposition Card */}
      {analysis && (
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Atom size={20} className="text-emerald-400" />
              <h3 className="text-sm font-bold tracking-wide">Hamiltonian Energy State Decomposition: E(x) = xᵀ Q x</h3>
            </div>
            <div className="flex items-center gap-2">
              {analysis.default_energy_decomposition.is_valid_solution ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle size={14} /> Zero Constraint Violations
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle size={14} /> Penalty Incurred (Infeasible State)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <p className="text-slate-400">Total Energy E(x)</p>
              <p className="text-lg font-bold text-white mt-1">{analysis.default_energy_decomposition.total_energy}</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <p className="text-slate-400">Route Cost Term</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{analysis.default_energy_decomposition.objective_term}</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <p className="text-slate-400">Coverage Penalty (λ₁)</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{analysis.default_energy_decomposition.coverage_penalty_term}</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <p className="text-slate-400">Reuse Penalty (λ₂)</p>
              <p className="text-lg font-bold text-rose-400 mt-1">{analysis.default_energy_decomposition.reuse_penalty_term}</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <p className="text-slate-400">Availability Penalty (λ₃)</p>
              <p className="text-lg font-bold text-rose-400 mt-1">{analysis.default_energy_decomposition.availability_penalty_term}</p>
            </div>
          </div>

          {/* Interactive Bitstring Toggle Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Interactive Decision Bitstring x ∈ {'{0, 1}'}ᴺ (Click to flip spin):</span>
              <span>{analysis.default_energy_decomposition.active_bits_count} bits active (1)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bitstring.split('').map((bit, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleBit(idx)}
                  className={`w-8 h-8 rounded text-xs font-mono font-bold transition-all ${
                    bit === '1'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Variable: ${analysis.variable_labels[idx] || `x[${idx}]`}`}
                >
                  {bit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Heatmap Grid & Cell Inspector */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* N x N Matrix Heatmap */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">QUBO Matrix Heatmap Q ({analysis.matrix_size} × {analysis.matrix_size})</h3>
                <p className="text-xs text-gray-400">Diagonal = Linear Biases; Off-Diagonal = Quadratic Couplers</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">Sparsity: {analysis.sparsity_pct}%</span>
            </div>

            <div className="overflow-x-auto p-2 border border-gray-100 rounded-lg bg-gray-50/50">
              <div
                className="grid gap-1 min-w-[420px]"
                style={{
                  gridTemplateColumns: `repeat(${analysis.matrix_size}, minmax(0, 1fr))`,
                }}
              >
                {analysis.matrix_grid.map((row: number[], rIdx: number) =>
                  row.map((val: number, cIdx: number) => {
                    const isDiag = rIdx === cIdx;
                    const isUpper = cIdx >= rIdx;
                    return (
                      <button
                        key={`${rIdx}-${cIdx}`}
                        disabled={!isUpper}
                        onClick={() => {
                          const cellObj = analysis.cells.find(
                            (c: any) => c.row === rIdx && c.col === cIdx
                          );
                          if (cellObj) setSelectedCell(cellObj);
                        }}
                        className={`h-9 rounded text-[10px] font-mono font-bold flex items-center justify-center border transition-all ${
                          !isUpper
                            ? 'bg-gray-50/20 border-transparent text-transparent cursor-default'
                            : `${getCellColor(val, isDiag)} hover:scale-105 cursor-pointer`
                        } ${
                          selectedCell?.row === rIdx && selectedCell?.col === cIdx
                            ? 'ring-2 ring-emerald-600 z-10'
                            : ''
                        }`}
                        title={`Q[${rIdx},${cIdx}] = ${val}`}
                      >
                        {isUpper ? (val === 0 ? '·' : Math.round(val)) : ''}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Matrix Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-50">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></span> Linear Bias (Negative offset)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></span> Quadratic Penalty Coupler (Positive)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span> Zero Coupling
              </span>
            </div>
          </div>

          {/* Cell Inspector Card */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedCell ? `Q[${selectedCell.row}, ${selectedCell.col}]` : 'Q[0, 0]'}
                </span>
                <span className="text-xs text-gray-500 font-medium capitalize">
                  {selectedCell?.term_type?.replace('_', ' ') || 'Linear Bias'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                <p className="text-[11px] text-gray-500">Numerical Value in Matrix</p>
                <p className="text-xl font-mono font-bold text-gray-900">{selectedCell?.value ?? 0}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-gray-400">Row Variable xᵢ</p>
                  <p className="font-semibold text-gray-800">{selectedCell?.var_row_label || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Column Variable xⱼ</p>
                  <p className="font-semibold text-gray-800">{selectedCell?.var_col_label || '—'}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-400 mb-1">Physical / Hamiltonian Meaning</p>
                  <p className="text-gray-700 leading-relaxed bg-emerald-50/40 p-2 rounded border border-emerald-100">
                    {selectedCell?.explanation || 'Select any cell in the heatmap matrix to inspect its physical meaning.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Matrix Properties Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-2 text-xs">
              <h4 className="font-bold text-gray-800 mb-2">Matrix Spectrum Properties</h4>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Minimum Coefficient</span>
                <span className="font-mono text-gray-800 font-bold">{analysis.min_value}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Maximum Coefficient</span>
                <span className="font-mono text-gray-800 font-bold">{analysis.max_value}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Mean Diagonal Bias</span>
                <span className="font-mono text-gray-800 font-bold">{analysis.diagonal_mean}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Mean Off-Diagonal Coupler</span>
                <span className="font-mono text-gray-800 font-bold">{analysis.off_diagonal_mean}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
