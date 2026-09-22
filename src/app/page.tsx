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
  ChevronDown,
  ChevronUp,
  X,
  UserCheck,
  Key,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserRole } from '@/types/cmms';

const USER_CREDENTIALS = [
  {
    role: 'CEO' as UserRole,
    id: 'CEO-01',
    name: 'Dr. K. Ramanathan',
    title: 'Chief Executive Officer',
    email: 'ceo@textech.garments',
    pass: 'ceo123',
    route: '/dashboard/messages',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Crown,
  },
  {
    role: 'ADMIN' as UserRole,
    id: 'ADM-01',
    name: 'V. Sundaram',
    title: 'Plant Admin & Asset Director',
    email: 'admin@textech.garments',
    pass: 'admin123',
    route: '/dashboard/machines',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ShieldCheck,
  },
  {
    role: 'SENIOR_MECHANIC' as UserRole,
    id: 'MEC-01',
    name: 'Ramesh Kumar',
    title: 'Senior Master Mechanic',
    email: 'seniormechanic@textech.garments',
    pass: 'senior123',
    route: '/dashboard/calendar',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Wrench,
  },
  {
    role: 'MECHANIC' as UserRole,
    id: 'MEC-08',
    name: 'Suresh Babu',
    title: 'Line Sewing Mechanic',
    email: 'mechanic@textech.garments',
    pass: 'mechanic123',
    route: '/dashboard/calendar',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: HardHat,
  },
  {
    role: 'STORE_PERSON' as UserRole,
    id: 'STR-01',
    name: 'M. Arumugam',
    title: 'Tool Crib & Store In-Charge',
    email: 'stores@textech.garments',
    pass: 'stores123',
    route: '/dashboard/store-inbox',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Package,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginAsRole, loginWithEmail } = useAuth();
  const { showToast } = useToast();

  const [emailOrId, setEmailOrId] = useState('CEO-01');
  const [password, setPassword] = useState('ceo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Directory & Reset Password modal state
  const [isCredentialDirOpen, setIsCredentialDirOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('ceo@textech.garments');
  const [newCustomPass, setNewCustomPass] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = (emailOrId || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanInput) {
      showToast('Please enter an employee ID or email', 'warning');
      return;
    }
    if (!cleanPass) {
      showToast('Please enter the password', 'warning');
      return;
    }
    setIsLoading(true);

    try {
      const lower = cleanInput.toLowerCase();
      let email = cleanInput;
      let targetRoute = '/dashboard/machines';

      if (lower.includes('@')) {
        // Normalize domain variants
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
      showToast('Authentication verified in Firebase. Welcome to TexTech CMMS!', 'success');
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

  const handleSetPasswordInFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !newCustomPass.trim()) {
      showToast('Please provide both email and new password', 'warning');
      return;
    }
    if (newCustomPass.trim().length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          password: newCustomPass.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      showToast(data.message || `Password updated for ${resetEmail} in Firebase!`, 'success');
      setEmailOrId(resetEmail.trim());
      setPassword(newCustomPass.trim());
      setIsResetModalOpen(false);
      setNewCustomPass('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
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
            <span>Firebase Auth Live</span>
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
                <span className="text-[11px] text-indigo-600 font-medium">Quick Persona Select:</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {USER_CREDENTIALS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEmailOrId(item.id);
                      setPassword(item.pass);
                    }}
                    className={`py-1 text-[11px] font-semibold rounded-lg border transition text-center cursor-pointer ${
                      emailOrId === item.id || emailOrId === item.email
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.role === 'SENIOR_MECHANIC' ? 'Sr. Mech' : item.role === 'STORE_PERSON' ? 'Stores' : item.role === 'MECHANIC' ? 'Mechanic' : item.role}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>Set / Change Password</span>
                </button>
              </div>
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-0.5">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    Current Password: <strong className="text-indigo-700 font-mono">{password || 'ceo123'}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCredentialDirOpen(!isCredentialDirOpen)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All User Passwords</span>
                  {isCredentialDirOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Collapsible User Passwords Directory */}
            {isCredentialDirOpen && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Firebase User Directory & Passwords</span>
                  <span className="text-[10px] font-mono text-slate-400">maintenance-module-9c497</span>
                </div>
                <div className="space-y-1.5">
                  {USER_CREDENTIALS.map((u) => {
                    const UIcon = u.icon;
                    return (
                      <div
                        key={u.id}
                        className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`p-1 rounded-lg ${u.badge}`}>
                            <UIcon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                {u.id}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{u.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                            {u.pass}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailOrId(u.email);
                              setPassword(u.pass);
                              showToast(`Loaded credentials for ${u.name}`, 'info');
                            }}
                            className="px-2 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition cursor-pointer"
                          >
                            Fill
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 text-center pt-0.5">
                  Universal fallback password: <code className="font-bold text-slate-600">sewing123</code>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Authenticating with Firebase...' : 'Sign in with Firebase Auth'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Persona Authentication Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 block mb-2 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Firebase 1-Click Fast Login (Instant Persona):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {USER_CREDENTIALS.map((u) => {
                const UIcon = u.icon;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickRole(u.role)}
                    className="text-xs py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition shadow-xs text-center cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <UIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{u.role === 'SENIOR_MECHANIC' ? 'Sr. Mech' : u.role === 'STORE_PERSON' ? 'Stores' : u.role}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal truncate max-w-full">
                      {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Garment Manufacturing Plant 03 • Coimbatore Unit • Firebase Authenticated
          </p>
        </div>
      </div>

      {/* Set / Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-950 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Create / Reset Password</h3>
                  <p className="text-[11px] text-slate-400">
                    Set a new password for any user directly in Firebase Auth
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetPasswordInFirebase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select User Account *
                </label>
                <select
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  {USER_CREDENTIALS.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Or Custom Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="e.g. user@textech.garments"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  New Password *
                </label>
                <input
                  type="text"
                  value={newCustomPass}
                  onChange={(e) => setNewCustomPass(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Password will be written directly into Firebase Cloud Authentication.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isResetting ? 'Setting Password...' : 'Save Password in Firebase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
