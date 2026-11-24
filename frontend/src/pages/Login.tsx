import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Boxes, ShieldCheck, UserCheck, ArrowRight, Lock, KeyRound, Server, Activity } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('error', 'Missing Information', 'Please enter your username and password.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post('/auth/login', {
        username: identifier,
        password: password,
      });

      const { token, user } = resp.data;
      login(token, user);
      showToast('success', `Welcome back, ${user.username}!`, `Logged in as ${user.role}.`);
      navigate('/');
    } catch (err: any) {
      showToast('error', 'Login Failed', err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUser: 'admin' | 'staff') => {
    setLoading(true);
    try {
      const payload =
        demoUser === 'admin'
          ? { username: 'admin', password: 'Admin@123' }
          : { username: 'staff', password: 'Staff@123' };

      const resp = await api.post('/auth/login', payload);
      const { token, user } = resp.data;
      login(token, user);
      showToast('success', 'Demo Login Successful', `Authenticated as ${user.role} (${user.username}).`);
      navigate('/');
    } catch (err: any) {
      showToast('error', 'Demo Login Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
      {/* Left Hero Pane */}
      <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border-b md:border-b-0 md:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">SmartStock</span>
              <p className="text-xs text-brand-400 font-mono font-medium">Enterprise Edition v1.0</p>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Enterprise Inventory & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                DevOps Automation Platform
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
              A production-style distributed inventory management platform featuring atomic concurrency control,
              Kubernetes orchestration, CI/CD automation, and intelligent root cause log diagnostics.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Backend-enforced RBAC (Admin vs Employee) & strict negative inventory locks</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <Server className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Full DevOps Pipeline: Docker multi-stage, Jenkins, Kubernetes, Terraform & Ansible</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <Activity className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Prometheus metrics, structured JSON audit logs & bonus AI diagnostic analyzer</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>High-Availability Cloud Ledger</span>
          <span>Zero-Downtime Architecture</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="md:w-1/2 p-6 md:p-14 flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Authenticate to access inventory and DevOps control plane</p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              1-Click Quick Demo Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Login as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staff')}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Login as Staff
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or admin@smartstock.io"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
