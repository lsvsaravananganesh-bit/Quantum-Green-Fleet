import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Gauge, Shield, UserCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4">
      {/* Decorative ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl mb-4">
            <Gauge size={34} className="text-green-300" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quantum Green Fleet</h1>
          <p className="text-green-200/80 text-sm mt-1">
            Quantum-Inspired Fuel Prediction & Fleet Optimization
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sign in to manage your sustainable fleet</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2.5">
              <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fleet.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-base mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-green-600" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Demo Login</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@fleet.com', 'admin123')}
                className="p-2.5 bg-green-50/80 hover:bg-green-100/80 border border-green-200/60 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-green-900 font-semibold text-xs">
                  <Shield size={14} className="text-green-700" />
                  <span>Admin</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">admin@fleet.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('manager@fleet.com', 'manager123')}
                className="p-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                  <UserCheck size={14} className="text-blue-700" />
                  <span>Fleet Manager</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">manager@fleet.com</p>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-green-700 hover:text-green-800 underline">
              Create an account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-green-200/60 mt-6">
          © 2026 Quantum Green Fleet Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
