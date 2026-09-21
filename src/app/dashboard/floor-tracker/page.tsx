'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowRight,
  Factory,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Machine, FloorLine } from '@/types/cmms';
import { subscribeMachines } from '@/lib/services/cmmsService';
import { ScanModal } from '@/components/scan/ScanModal';

interface LineDefinition {
  name: FloorLine;
  desc: string;
  badgeBg: string;
}

export default function FloorTrackerPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveMachineId, setTargetMoveMachineId] = useState('');

  useEffect(() => {
    const unsub = subscribeMachines((data) => setMachines(data));
    return () => unsub();
  }, []);

  const totalMachines = machines.length;
  const activeMachines = useMemo(
    () => machines.filter((m) => m.status === 'ACTIVE').length,
    [machines]
  );
  const breakdownMachines = useMemo(
    () => machines.filter((m) => m.status === 'BREAKDOWN').length,
    [machines]
  );
  const bufferMachines = useMemo(
    () => machines.filter((m) => m.status === 'BUFFER').length,
    [machines]
  );
  const totalValuation = useMemo(
    () => machines.reduce((acc, m) => acc + (m.cost || 0), 0),
    [machines]
  );

  const floorLines: LineDefinition[] = [
    {
      name: 'Line 01',
      desc: 'Polo Shirt & Knit Seam Line',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      name: 'Line 02',
      desc: 'Basic T-Shirt Assembly Line',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'Line 03',
      desc: 'Woven Shirts & Buttoning',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      name: 'Line 04',
      desc: 'Denim & Twill Heavy Line',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    {
      name: 'Buffer Workshop',
      desc: 'Mechanic Bay & Ready Standby',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'Scrap Bay',
      desc: 'Cannibalization & Written Off',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const handleOpenMove = (machineId: string) => {
    setTargetMoveMachineId(machineId);
    setIsMoveModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Asset Management & Floor Layout Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Floor-wide audit of all physical capital. Track live line assignments, buffer standby machines, and total plant valuations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/machines"
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Asset</span>
          </Link>
        </div>
      </div>

      {/* Plant Asset KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Machinery
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalMachines}</div>
          <div className="text-[11px] text-slate-500">Sewing, Overlock & Bartack</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active on Sewing Lines
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">{activeMachines}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Lines 01 to 04 running</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Under Breakdown / Repair
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {breakdownMachines}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Line stopped alerts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Standby / Buffer Pool
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">{bufferMachines}</div>
          <div className="text-[11px] text-slate-500">Ready for quick substitution</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Asset Valuation
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 font-mono">
            ${totalValuation.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Book acquisition value</div>
        </div>
      </div>

      {/* Visual Factory Floor Layout Plan */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Factory className="w-4 h-4 text-indigo-600" />
              <span>Interactive Production Floor & Line Distribution</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live operational status of sewing machines grouped by production lines and standby maintenance bays.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Operational</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Breakdown</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>In Buffer</span>
            </span>
          </div>
        </div>

        {/* 6 Line Distribution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {floorLines.map((line) => {
            const lineMachines = machines.filter((m) => m.currentLine === line.name);

            return (
              <div
                key={line.name}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight">{line.name}</h4>
                      <span className="text-[11px] text-slate-400">{line.desc}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                      {lineMachines.length} M/C
                    </span>
                  </div>

                  <div className="space-y-2.5 mt-3 max-h-72 overflow-y-auto pr-1">
                    {lineMachines.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No machines currently staged on this line.
                      </p>
                    ) : (
                      lineMachines.map((m) => {
                        const isDown = m.status === 'BREAKDOWN';
                        const isBuffer = m.status === 'BUFFER';

                        const dotColor = isDown
                          ? 'bg-rose-500 animate-ping'
                          : isBuffer
                          ? 'bg-amber-500'
                          : 'bg-emerald-500';

                        const badgeClass = isDown
                          ? 'bg-rose-50 border-rose-200 text-rose-700 urgent-pulse'
                          : isBuffer
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700';

                        return (
                          <div
                            key={m.id}
                            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3 text-xs transition space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                <span className="font-mono font-bold text-slate-900">{m.id}</span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}
                              >
                                {m.status}
                              </span>
                            </div>

                            <div className="text-[11px] font-medium text-slate-700 truncate">
                              {m.brand} • {m.typeName || m.type}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                              <span className="font-semibold text-slate-600">{m.stationNo}</span>
                              <button
                                onClick={() => handleOpenMove(m.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <span>Manage / Move</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relocate Modal Triggered from Floor Card */}
      <ScanModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        preselectedMachineId={targetMoveMachineId}
      />
    </div>
  );
}
