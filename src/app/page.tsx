'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  IdCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Crown,
  Package,
  HardHat,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserRole } from '@/types/cmms';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsRole, loginWithEmail } = useAuth();
  const { showToast } = useToast();

  const [emailOrId, setEmailOrId] = useState('CEO-01');
  const [password, setPassword] = useState('sewing123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = (emailOrId || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanInput) {
      showToast('Please enter an employee ID or email', 'warning');
      return;
    }
    if (!cleanPass) {
      showToast('Please enter the password (default: sewing123)', 'warning');
      return;
    }
    setIsLoading(true);

    try {
      const lower = cleanInput.toLowerCase();
      let email = cleanInput;
      let targetRoute = '/dashboard/machines';

      if (lower.includes('@')) {
        // Normalize any @textech domain variants
        if (lower.startsWith('ceo@')) {
          email = 'ceo@textech.garments';
          targetRoute = '/dashboard/messages';
        } else if (lower.startsWith('admin@') || lower.startsWith('adm@')) {
          email = 'admin@textech.garments';
          targetRoute = '/dashboard/machines';
        } else if (lower.startsWith('senior') || lower.startsWith('seniormechanic@')) {
          email = 'seniormechanic@textech.garments';
          targetRoute = '/dashboard/calendar';
        } else if (lower.startsWith('store') || lower.startsWith('stores@')) {
          email = 'stores@textech.garments';
          targetRoute = '/dashboard/store-inbox';
        } else if (lower.startsWith('mechanic@')) {
          email = 'mechanic@textech.garments';
          targetRoute = '/dashboard/calendar';
        } else {
          const [prefix] = lower.split('@');
          if (prefix === 'ceo') email = 'ceo@textech.garments';
          else if (prefix === 'admin') email = 'admin@textech.garments';
          else if (prefix === 'seniormechanic') email = 'seniormechanic@textech.garments';
          else if (prefix === 'mechanic') email = 'mechanic@textech.garments';
          else if (prefix === 'stores' || prefix === 'store') email = 'stores@textech.garments';
        }
      } else {
        if (lower.includes('ceo')) {
          email = 'ceo@textech.garments';
          targetRoute = '/dashboard/messages';
        } else if (lower.includes('admin') || lower.includes('adm')) {
          email = 'admin@textech.garments';
          targetRoute = '/dashboard/machines';
        } else if (lower.includes('senior') || lower.includes('mec-01') || lower.includes('ramesh')) {
          email = 'seniormechanic@textech.garments';
          targetRoute = '/dashboard/calendar';
        } else if (lower.includes('store') || lower.includes('str') || lower.includes('arumugam')) {
          email = 'stores@textech.garments';
          targetRoute = '/dashboard/store-inbox';
        } else {
          email = 'mechanic@textech.garments';
          targetRoute = '/dashboard/calendar';
        }
      }

      await loginWithEmail(email, cleanPass);
      showToast('Authentication verified. Welcome to TexTech CMMS!', 'success');
      router.push(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      await loginAsRole(role);
      let targetRoute = '/dashboard/machines';
      let roleLabel = 'Staff';

      switch (role) {
        case 'CEO':
          roleLabel = 'CEO (Dr. K. Ramanathan)';
          targetRoute = '/dashboard/messages';
          break;
        case 'ADMIN':
        case 'ASSET_MANAGER':
          roleLabel = 'Plant Admin (V. Sundaram)';
          targetRoute = '/dashboard/machines';
          break;
        case 'SENIOR_MECHANIC':
          roleLabel = 'Senior Mechanic (Ramesh Kumar)';
          targetRoute = '/dashboard/calendar';
          break;
        case 'MECHANIC':
          roleLabel = 'Line Mechanic (Suresh Babu)';
          targetRoute = '/dashboard/calendar';
          break;
        case 'STORE_PERSON':
          roleLabel = 'Store Person (M. Arumugam)';
          targetRoute = '/dashboard/store-inbox';
          break;
      }

      showToast(`Authenticated via Firebase as ${roleLabel}!`, 'success');
      router.push(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-6 text-white text-center relative border-b border-indigo-950">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 mb-2 shadow-inner">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">TexTech Garments</h1>
          <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mt-0.5">
            Firebase Cloud Authentication & CMMS Suite
          </p>
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] bg-emerald-500/20 px-2.5 py-0.5 rounded-full text-emerald-300 border border-emerald-500/30 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firebase Auth</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleFormLogin} className="space-y-3">
            {/* Quick-select chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Employee ID or Email
                </label>
                <span className="text-[11px] text-indigo-600 font-medium">Quick Select:</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {[
                  { id: 'CEO-01', label: 'CEO' },
                  { id: 'ADM-01', label: 'Admin' },
                  { id: 'MEC-01', label: 'Sr. Mech' },
                  { id: 'MEC-02', label: 'Mechanic' },
                  { id: 'STR-01', label: 'Stores' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEmailOrId(item.id);
                      setPassword('sewing123');
                    }}
                    className={`py-1 text-[11px] font-semibold rounded-lg border transition text-center ${
                      emailOrId === item.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-slate-800"
                  placeholder="e.g. ceo@textech.garments or CEO-01"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-slate-800 font-mono tracking-wider"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5 px-0.5">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Default password: <strong className="text-indigo-600 font-mono font-bold">sewing123</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => setPassword('sewing123')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  Fill sewing123
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition duration-150 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating with Firebase...' : 'Sign in with Firebase Auth'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Pure Firebase Persona Quick Auth (5 specialized roles) */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 block mb-2 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Firebase 1-Click Authentication (Select Persona):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* CEO */}
              <button
                type="button"
                onClick={() => handleQuickRole('CEO')}
                className="text-xs py-2 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition shadow-xs text-center"
              >
                <div className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-purple-600" />
                  <span>CEO</span>
                </div>
                <span className="text-[10px] text-purple-600 font-normal truncate max-w-full">
                  Dr. Ramanathan
                </span>
              </button>

              {/* Plant Admin */}
              <button
                type="button"
                onClick={() => handleQuickRole('ADMIN')}
                className="text-xs py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition shadow-xs text-center"
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin</span>
                </div>
                <span className="text-[10px] text-blue-600 font-normal truncate max-w-full">
                  V. Sundaram
                </span>
              </button>

              {/* Store Person */}
              <button
                type="button"
                onClick={() => handleQuickRole('STORE_PERSON')}
                className="text-xs py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition shadow-xs text-center"
              >
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Store Person</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-normal truncate max-w-full">
                  M. Arumugam
                </span>
              </button>

              {/* Senior Mechanic */}
              <button
                type="button"
                onClick={() => handleQuickRole('SENIOR_MECHANIC')}
                className="text-xs py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition shadow-xs text-center"
              >
                <div className="flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sr. Mechanic</span>
                </div>
                <span className="text-[10px] text-indigo-600 font-normal truncate max-w-full">
                  Ramesh Kumar
                </span>
              </button>

              {/* Line Mechanic */}
              <button
                type="button"
                onClick={() => handleQuickRole('MECHANIC')}
                className="text-xs py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition shadow-xs text-center"
              >
                <div className="flex items-center gap-1">
                  <HardHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Line Mechanic</span>
                </div>
                <span className="text-[10px] text-amber-600 font-normal truncate max-w-full">
                  Suresh Babu
                </span>
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
