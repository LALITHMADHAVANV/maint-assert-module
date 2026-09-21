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
} from 'lucide-react';
import { LiveClock } from './LiveClock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { subscribeParts, subscribeRepairs, resetToSeedData } from '@/lib/services/cmmsService';
import { ScanModal } from '@/components/scan/ScanModal';
import { CameraScannerModal } from '@/components/scan/CameraScannerModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isFirebaseLive, loginAsRole, logout } = useAuth();
  const { showToast } = useToast();

  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);

  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
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

    return () => {
      unsubParts();
      unsubRepairs();
    };
  }, []);

  const handleResetSeed = async () => {
    setIsSeeding(true);
    try {
      await resetToSeedData();
      showToast('Factory database reset to realistic apparel seed dataset!', 'success');
    } catch (e) {
      showToast('Error resetting seed data', 'error');
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  const navTabs = [
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
      label: '5. Asset Management & Floor',
      href: '/dashboard/floor-tracker',
      icon: Layers,
    },
  ];

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800 no-print">
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
                className="hidden xl:flex items-center space-x-1.5 text-[11px] bg-slate-800/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer text-slate-300 transition"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFirebaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isFirebaseLive ? 'Cloud Firestore' : 'Demo Local Mode'}</span>
                <RefreshCw className={`w-3 h-3 text-slate-400 ml-1 ${isSeeding ? 'animate-spin' : ''}`} />
              </div>

              {/* Live Floor Clock */}
              <LiveClock />

              {/* Camera Scanner Trigger */}
              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
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
                <span>Simulate Scan</span>
              </button>

              {/* User Profile & Role Switcher */}
              <div className="flex items-center space-x-2 bg-slate-800 py-1 px-2.5 rounded-xl border border-slate-700">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                  {user?.name?.charAt(0) || 'M'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold leading-tight">{user?.name || 'Ramesh Kumar'}</div>
                  <div className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                    {user?.title || 'Lead Mechanic'}
                  </div>
                </div>

                {/* Quick Role Toggle button */}
                <button
                  onClick={() => {
                    const nextRole = role === 'MECHANIC' ? 'ASSET_MANAGER' : 'MECHANIC';
                    loginAsRole(nextRole);
                    showToast(
                      `Switched role to ${nextRole === 'MECHANIC' ? 'Lead Mechanic' : 'Asset Manager'}`,
                      'info'
                    );
                  }}
                  title="Toggle Role Demo (Mechanic / Asset Manager)"
                  className="p-1 text-slate-400 hover:text-indigo-300 transition ml-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>

                {/* Logout button */}
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  title="Sign Out to Login Portal"
                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Navbar Tabs */}
        <nav className="bg-slate-800 border-t border-slate-700/60 overflow-x-auto">
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
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
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
