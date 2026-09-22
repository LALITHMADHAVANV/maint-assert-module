'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wrench,
  QrCode,
  Boxes,
  History,
  CalendarCheck,
  Layers,
  LogOut,
  Sparkles,
  Database,
  Camera,
  RefreshCw,
  UserCheck,
  Crown,
  Package,
  ShieldCheck,
  HardHat,
  MessageSquare,
  ChevronDown,
  Users,
  SlidersHorizontal,
} from 'lucide-react';
import { LiveClock } from './LiveClock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  subscribeParts,
  subscribeRepairs,
  subscribeRequisitions,
  resetToSeedData,
} from '@/lib/services/cmmsService';
import { ScanModal } from '@/components/scan/ScanModal';
import { CameraScannerModal } from '@/components/scan/CameraScannerModal';
import { UserRole } from '@/types/cmms';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isFirebaseLive, loginAsRole, logout } = useAuth();
  const { showToast } = useToast();

  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);
  const [pendingCeoCount, setPendingCeoCount] = useState<number>(0);
  const [pendingStoreCount, setPendingStoreCount] = useState<number>(0);

  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  useEffect(() => {
    const unsubParts = subscribeParts((parts) => {
      const low = parts.filter((p) => p.stock <= p.minStock).length;
      setLowStockCount(low);
    });

    const unsubRepairs = subscribeRepairs((repairs) => {
      const pending = repairs.filter((r) => r.status !== 'COMPLETED').length;
      setPendingTicketsCount(pending);
    });

    const unsubReqs = subscribeRequisitions((reqs) => {
      const ceoPending = reqs.filter(
        (r) =>
          (r.type === 'CRITICAL_CEO' || r.requiresCeoApproval) &&
          r.status === 'PENDING_CEO_APPROVAL'
      ).length;
      setPendingCeoCount(ceoPending);

      const storePending = reqs.filter(
        (r) => r.type === 'MONTHLY_INDENT' && r.status !== 'FULFILLED'
      ).length;
      setPendingStoreCount(storePending);
    });

    return () => {
      unsubParts();
      unsubRepairs();
      unsubReqs();
    };
  }, []);

  const handleResetSeed = async () => {
    setIsSeeding(true);
    try {
      await resetToSeedData();
      showToast('Factory database reset to realistic apparel seed dataset across all collections!', 'success');
    } catch (e) {
      showToast('Error resetting seed data', 'error');
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    setIsRoleDropdownOpen(false);
    try {
      await loginAsRole(newRole);

      let targetRoute = '/dashboard/machines';
      let label = 'Staff';

      switch (newRole) {
        case 'CEO':
          label = 'CEO (Dr. K. Ramanathan)';
          targetRoute = '/dashboard/messages';
          break;
        case 'ADMIN':
        case 'ASSET_MANAGER':
          label = 'Plant Admin (V. Sundaram)';
          targetRoute = '/dashboard/machines';
          break;
        case 'SENIOR_MECHANIC':
          label = 'Senior Master Mechanic (Ramesh Kumar)';
          targetRoute = '/dashboard/calendar';
          break;
        case 'MECHANIC':
          label = 'Line Mechanic (Suresh Babu)';
          targetRoute = '/dashboard/calendar';
          break;
        case 'STORE_PERSON':
          label = 'Store Person (M. Arumugam)';
          targetRoute = '/dashboard/store-inbox';
          break;
      }

      showToast(`Authenticated via Firebase as ${label}!`, 'info');
      router.push(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Firebase Auth error: ${msg}`, 'error');
    }
  };

  interface NavTab {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
    badgeColor?: string;
    highlight?: boolean;
  }

  // Define role-specific navigation tabs strictly matching the mandatory responsibility matrix
  const isMechanicOrAdmin =
    role === 'MECHANIC' || role === 'SENIOR_MECHANIC' || role === 'ADMIN' || role === 'ASSET_MANAGER';

  let navTabs: NavTab[] = [];

  if (role === 'CEO') {
    // 👑 CEO: Executive approval desk, factory history/downtime ledger, and machine fleet overview
    navTabs = [
      {
        label: '👑 Critical Approvals (CEO)',
        href: '/dashboard/messages',
        icon: Crown,
        badge: pendingCeoCount > 0 ? pendingCeoCount : null,
        badgeColor: 'bg-rose-600 text-white animate-pulse',
        highlight: true,
      },
      {
        label: 'Plant History & Downtime Ledger',
        href: '/dashboard/history',
        icon: History,
      },
      {
        label: 'Factory Machine Fleet',
        href: '/dashboard/machines',
        icon: QrCode,
      },
    ];
  } else if (role === 'STORE_PERSON') {
    // 📦 STORE PERSON: Monthly indents receiver and tool crib inventory custodian
    navTabs = [
      {
        label: '📦 Monthly Store Indents',
        href: '/dashboard/store-inbox',
        icon: Package,
        badge: pendingStoreCount > 0 ? pendingStoreCount : null,
        badgeColor: 'bg-emerald-500 text-white',
        highlight: true,
      },
      {
        label: 'Tool Crib Inventory',
        href: '/dashboard/inventory',
        icon: Boxes,
        badge: lowStockCount > 0 ? lowStockCount : null,
        badgeColor: 'bg-rose-500 text-white',
      },
    ];
  } else if (role === 'MECHANIC') {
    // 🦺 LINE MECHANIC: Monthly work calendar, attend & fix, and spare parts/indents request
    navTabs = [
      {
        label: '📅 Mechanic Work Calendar',
        href: '/dashboard/calendar',
        icon: CalendarCheck,
        badge: pendingTicketsCount > 0 ? pendingTicketsCount : null,
        badgeColor: 'bg-amber-400 text-slate-950 font-extrabold',
        highlight: true,
      },
      {
        label: 'Tool Crib & Monthly Indents',
        href: '/dashboard/inventory',
        icon: Boxes,
      },
    ];
  } else if (role === 'SENIOR_MECHANIC') {
    // 🔧 SENIOR MECHANIC: Monthly cloud calendar (PPM), machine relocation, parts, history, floor grid
    navTabs = [
      {
        label: '📅 Monthly Calendar & PPM',
        href: '/dashboard/calendar',
        icon: CalendarCheck,
        badge: pendingTicketsCount > 0 ? pendingTicketsCount : null,
        badgeColor: 'bg-amber-400 text-slate-950 font-extrabold',
        highlight: true,
      },
      {
        label: 'Machine Fleet & Relocation',
        href: '/dashboard/machines',
        icon: QrCode,
      },
      {
        label: 'Tool Crib & Indents',
        href: '/dashboard/inventory',
        icon: Boxes,
        badge: lowStockCount > 0 ? lowStockCount : null,
        badgeColor: 'bg-rose-500 text-white',
      },
      {
        label: 'Machine History & PPM',
        href: '/dashboard/history',
        icon: History,
      },
      {
        label: '👥 Team Work Roster',
        href: '/dashboard/mechanic-roster',
        icon: Users,
        highlight: true,
      },
      {
        label: 'Floor Grid',
        href: '/dashboard/floor-tracker',
        icon: Layers,
      },
    ];
  } else {
    // 🛡️ PLANT ADMIN / ASSET MANAGER: Master oversight across operational modules
    navTabs = [
      {
        label: '1. Machine Entry & QR',
        href: '/dashboard/machines',
        icon: QrCode,
      },
      {
        label: '2. Spare Parts Crib',
        href: '/dashboard/inventory',
        icon: Boxes,
        badge: lowStockCount > 0 ? lowStockCount : null,
        badgeColor: 'bg-rose-500 text-white',
      },
      {
        label: '3. Machine History & PPM',
        href: '/dashboard/history',
        icon: History,
      },
      {
        label: '4. Mechanic Calendar',
        href: '/dashboard/calendar',
        icon: CalendarCheck,
        badge: pendingTicketsCount > 0 ? pendingTicketsCount : null,
        badgeColor: 'bg-amber-400 text-slate-950 font-extrabold',
      },
      {
        label: '5. Asset Floor Grid',
        href: '/dashboard/floor-tracker',
        icon: Layers,
      },
      {
        label: '👑 CEO Approvals',
        href: '/dashboard/messages',
        icon: Crown,
        badge: pendingCeoCount > 0 ? pendingCeoCount : null,
        badgeColor: 'bg-rose-600 text-white',
      },
      {
        label: '📦 Store Indents',
        href: '/dashboard/store-inbox',
        icon: Package,
        badge: pendingStoreCount > 0 ? pendingStoreCount : null,
        badgeColor: 'bg-emerald-500 text-white',
      },
      {
        label: '👥 Team Roster',
        href: '/dashboard/mechanic-roster',
        icon: Users,
      },
    ];
  }

  // Get color for role badge
  const getRoleBadgeColor = () => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-600 text-white';
      case 'ADMIN':
      case 'ASSET_MANAGER':
        return 'bg-blue-600 text-white';
      case 'SENIOR_MECHANIC':
        return 'bg-indigo-600 text-white';
      case 'MECHANIC':
        return 'bg-amber-500 text-slate-950';
      case 'STORE_PERSON':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <>
      <header className="bg-slate-950 text-white sticky top-0 z-30 shadow-md border-b border-slate-800 no-print">
        {/* Top brand & system toolbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link href="/dashboard/machines" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner text-white font-bold text-lg group-hover:scale-105 transition">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight">
                    TexTech Garments
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/30">
                    CMMS v4.2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Sewing Machine Maintenance & Asset Ecosystem
                </p>
              </div>
            </Link>

            {/* Right side tools */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Database / Live Sync Indicator */}
              <div
                onClick={handleResetSeed}
                title="Click to reset or re-seed factory sample dataset"
                className="hidden xl:flex items-center space-x-1.5 text-[11px] bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer text-slate-300 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-300">Firebase Live</span>
                <RefreshCw className={`w-3 h-3 text-slate-400 ml-1 ${isSeeding ? 'animate-spin' : ''}`} />
              </div>

              {/* Live Floor Clock */}
              <LiveClock />

              {/* Floor QR Scanning Actions (Only visible for Mechanics and Plant Admin) */}
              {isMechanicOrAdmin && (
                <>
                  {/* Camera Scanner Trigger */}
                  <button
                    onClick={() => setIsCameraModalOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                    title="Scan QR Tag using Camera"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden md:inline">Camera</span>
                  </button>

                  {/* Simulate QR Scan Floor Action */}
                  <button
                    onClick={() => setIsScanModalOpen(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Tag</span>
                  </button>
                </>
              )}

              {/* User Profile & Role Switcher Popover */}
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 py-1 px-2.5 rounded-xl border border-slate-700 transition text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm ${getRoleBadgeColor()}`}
                  >
                    {role === 'CEO' ? (
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                    ) : role === 'STORE_PERSON' ? (
                      <Package className="w-3.5 h-3.5 text-white" />
                    ) : (
                      user?.name?.charAt(0) || 'M'
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>{user?.name || 'Dr. K. Ramanathan'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                      {role}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu for 5 Personas */}
                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Persona
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {/* CEO */}
                      <button
                        onClick={() => handleSwitchRole('CEO')}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                          role === 'CEO'
                            ? 'bg-purple-900/60 text-purple-200 font-bold border border-purple-700'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-purple-600 text-amber-300 flex items-center justify-center">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">Dr. K. Ramanathan</div>
                          <div className="text-[10px] text-purple-400">Chief Executive Officer</div>
                        </div>
                      </button>

                      {/* Admin */}
                      <button
                        onClick={() => handleSwitchRole('ADMIN')}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                          role === 'ADMIN' || role === 'ASSET_MANAGER'
                            ? 'bg-blue-900/60 text-blue-200 font-bold border border-blue-700'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">V. Sundaram</div>
                          <div className="text-[10px] text-blue-400">Plant Administrator</div>
                        </div>
                      </button>

                      {/* Store Person */}
                      <button
                        onClick={() => handleSwitchRole('STORE_PERSON')}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                          role === 'STORE_PERSON'
                            ? 'bg-emerald-900/60 text-emerald-200 font-bold border border-emerald-700'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">M. Arumugam</div>
                          <div className="text-[10px] text-emerald-400">Tool Crib Storekeeper</div>
                        </div>
                      </button>

                      {/* Senior Mechanic */}
                      <button
                        onClick={() => handleSwitchRole('SENIOR_MECHANIC')}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                          role === 'SENIOR_MECHANIC'
                            ? 'bg-indigo-900/60 text-indigo-200 font-bold border border-indigo-700'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <Wrench className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">Ramesh Kumar</div>
                          <div className="text-[10px] text-indigo-400">Senior Master Mechanic</div>
                        </div>
                      </button>

                      {/* Mechanic */}
                      <button
                        onClick={() => handleSwitchRole('MECHANIC')}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                          role === 'MECHANIC'
                            ? 'bg-amber-900/60 text-amber-200 font-bold border border-amber-700'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
                          <HardHat className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">Suresh Babu</div>
                          <div className="text-[10px] text-amber-400">Line Sewing Mechanic</div>
                        </div>
                      </button>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between px-2">
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          logout();
                          router.push('/');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Navbar Tabs */}
        <nav className="bg-slate-900 border-t border-slate-800/80 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 sm:space-x-2 py-1.5 whitespace-nowrap">
              {navTabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : tab.highlight
                        ? 'text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== null && tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                          tab.badgeColor || 'bg-indigo-500 text-white'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Floor Scanner Simulator Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onOpenLiveScanner={() => {
          setIsScanModalOpen(false);
          setIsCameraModalOpen(true);
        }}
      />

      {/* Live Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
      />
    </>
  );
}
