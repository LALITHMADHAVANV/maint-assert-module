'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, IdCard, Lock, ArrowRight, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsRole, loginWithEmail } = useAuth();
  const { showToast } = useToast();

  const [emailOrId, setEmailOrId] = useState('MEC-08');
  const [password, setPassword] = useState('sewing123');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId) {
      showToast('Please enter an employee ID or email', 'warning');
      return;
    }
    setIsLoading(true);

    try {
      const email = emailOrId.includes('@')
        ? emailOrId
        : emailOrId.toLowerCase().includes('mgr')
        ? 'manager@textech.garments'
        : 'mechanic@textech.garments';

      await loginWithEmail(email, password);
      showToast('Authentication verified. Welcome to TexTech CMMS!', 'success');
      router.push('/dashboard/machines');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Login failed: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (role: 'MECHANIC' | 'ASSET_MANAGER') => {
    loginAsRole(role);
    showToast(
      `Logged in as ${role === 'MECHANIC' ? 'Lead Mechanic (Ramesh Kumar)' : 'Asset Manager (V. Sundaram)'}`,
      'success'
    );
    router.push('/dashboard/machines');
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-8 text-white text-center relative border-b border-indigo-950">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 mb-3 shadow-inner">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">TexTech Garments</h1>
          <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mt-1">
            Sewing Maintenance & CMMS Suite
          </p>
          <div className="absolute top-4 right-4 text-[10px] bg-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-200 border border-indigo-500/30 font-semibold">
            Floor v4.2
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8 space-y-5">
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                User ID / Employee Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-slate-800"
                  placeholder="e.g. MEC-08 or MGR-01"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Floor Security PIN / Pass
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition duration-150 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Enter Maintenance Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400 block mb-2 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Quick Demo Role Access:</span>
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickRole('MECHANIC')}
                className="text-xs py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl flex items-center justify-center gap-1.5 font-bold transition shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Lead Mechanic</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('ASSET_MANAGER')}
                className="text-xs py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center gap-1.5 font-bold transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Asset Manager</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Garment Manufacturing Plant 03 • Coimbatore Unit
          </p>
        </div>
      </div>
    </div>
  );
}
