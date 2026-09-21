'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Clock,
  CalendarCheck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  User,
  Package,
  Activity,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';
import { Machine, RepairTicket, PPMSchedule } from '@/types/cmms';
import {
  subscribeMachines,
  subscribeRepairs,
  subscribePPMSchedules,
  completePPMTask,
} from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function HistoryPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [ppmSchedules, setPpmSchedules] = useState<PPMSchedule[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');

  useEffect(() => {
    const unsubM = subscribeMachines((data) => {
      setMachines(data);
      if (data.length > 0 && !selectedMachineId) {
        setSelectedMachineId(data[0].id);
      }
    });

    const unsubR = subscribeRepairs((data) => {
      setRepairs(data);
    });

    const unsubP = subscribePPMSchedules((data) => {
      setPpmSchedules(data);
    });

    return () => {
      unsubM();
      unsubR();
      unsubP();
    };
  }, [selectedMachineId]);

  const currentMachine = useMemo(
    () => machines.find((m) => m.id === selectedMachineId) || machines[0],
    [machines, selectedMachineId]
  );

  // Filter repairs for selected machine
  const machineRepairs = useMemo(() => {
    if (!currentMachine) return [];
    return repairs
      .filter((r) => r.machineId === currentMachine.id)
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [repairs, currentMachine]);

  // Breakdown incidents calculation
  const breakdownTickets = useMemo(
    () => machineRepairs.filter((r) => r.faultCategory !== 'Preventive Overhaul' && r.faultCategory !== 'Line Rebalancing'),
    [machineRepairs]
  );

  const totalDowntime = useMemo(() => {
    return machineRepairs.reduce((acc, cur) => acc + (cur.downtimeMinutes || 0), 0);
  }, [machineRepairs]);

  const mttr = useMemo(() => {
    return breakdownTickets.length > 0
      ? (totalDowntime / breakdownTickets.length).toFixed(1)
      : '0.0';
  }, [totalDowntime, breakdownTickets]);

  // Filter PPM schedules for selected machine
  const machinePPM = useMemo(() => {
    if (!currentMachine) return [];
    return ppmSchedules.filter((p) => p.machineId === currentMachine.id);
  }, [ppmSchedules, currentMachine]);

  const handleCompletePPM = async (ppm: PPMSchedule) => {
    try {
      await completePPMTask(ppm.id, user?.name || 'Ramesh Kumar');
      showToast(`PPM Task "${ppm.task}" signed off and logged in ledger!`, 'success');
    } catch (err) {
      showToast('Failed to complete PPM task', 'error');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Machine Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Machine Dossier & Maintenance History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review complete corrective breakdown logs, MTTR analytics, and execute scheduled preventive maintenance (PPM).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Select Machine:</label>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs text-slate-800"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} ({m.brand} {m.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Machine Dossier KPI Strip */}
      {currentMachine && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Machine Brand & Type
            </span>
            <div className="text-sm font-bold text-slate-900 truncate">
              {currentMachine.brand} • {currentMachine.model}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {currentMachine.id} • {currentMachine.motorType}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Current Location
            </span>
            <div className="text-sm font-bold text-emerald-700 truncate">
              {currentMachine.currentLine} ({currentMachine.stationNo})
            </div>
            <div
              className={`text-[10px] font-bold uppercase ${
                currentMachine.status === 'ACTIVE'
                  ? 'text-emerald-600'
                  : currentMachine.status === 'BREAKDOWN'
                  ? 'text-rose-600 urgent-pulse'
                  : 'text-amber-600'
              }`}
            >
              {currentMachine.status}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Lifetime Breakdowns
            </span>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {breakdownTickets.length} Incidents
            </div>
            <div className="text-[10px] text-slate-500">Logged since installation</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Cumulative Downtime
            </span>
            <div className="text-sm font-bold text-rose-600 font-mono">{totalDowntime} mins</div>
            <div className="text-[10px] text-slate-500">Production line loss</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              MTTR (Mean Repair Time)
            </span>
            <div className="text-sm font-bold text-indigo-600 font-mono">{mttr} mins</div>
            <div className="text-[10px] text-emerald-600 font-medium">Standard efficiency range</div>
          </div>
        </div>
      )}

      {/* Two-Column Layout: History Timeline (Left) & PPM Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Chronological Service Ledger */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Service & Breakdown Ledger</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Chronological order</span>
          </div>

          {machineRepairs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              No service or breakdown incidents recorded for this machine yet.
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {machineRepairs.map((item) => {
                const isBreakdown =
                  item.faultCategory !== 'Preventive Overhaul' &&
                  item.faultCategory !== 'Line Rebalancing';
                const isPPM = item.faultCategory === 'Preventive Overhaul';

                const dotBg = isBreakdown
                  ? 'bg-rose-100 border-rose-300 text-rose-600'
                  : isPPM
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-600'
                  : 'bg-amber-100 border-amber-300 text-amber-600';

                return (
                  <div key={item.id} className="relative flex items-start space-x-3 text-xs pl-8">
                    {/* Timeline icon node */}
                    <div
                      className={`absolute left-1.5 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center bg-white shadow-xs ${dotBg}`}
                    >
                      {isBreakdown ? (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      ) : isPPM ? (
                        <Wrench className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                      )}
                    </div>

                    {/* Ledger Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full shadow-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="text-xs">{item.faultCategory}: {item.faultDetails}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                          {item.reportedAt ? new Date(item.reportedAt).toLocaleDateString('en-GB') : 'Recent'}
                        </span>
                      </div>

                      {item.actionTaken && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          <b>Action Taken:</b> {item.actionTaken}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.attendedBy || item.reportedBy}</span>
                        </span>

                        <span className="flex items-center gap-1 font-medium">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>
                            {item.partsUsed && item.partsUsed.length > 0
                              ? item.partsUsed.map((p) => `${p.quantity}x ${p.name}`).join(', ')
                              : 'No parts replaced'}
                          </span>
                        </span>

                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">
                          {item.downtimeMinutes} min loss
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Scheduled PPM Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <span>Scheduled PPM Checklist</span>
                </h3>
                <p className="text-[11px] text-slate-500">Preventive intervals to avoid line stoppage</p>
              </div>
            </div>

            {machinePPM.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No scheduled PPM tasks active for this unit.
              </p>
            ) : (
              <div className="space-y-3">
                {machinePPM.map((ppm) => {
                  const isDueSoon = ppm.status === 'DUE_SOON';

                  return (
                    <div
                      key={ppm.id}
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition ${
                        isDueSoon
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">{ppm.task}</div>
                        <div className="text-[10px] text-slate-500">
                          Frequency:{' '}
                          <span className="font-semibold text-slate-700">{ppm.frequency}</span> • Due:{' '}
                          <span className="font-semibold text-indigo-700">{ppm.nextDue}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompletePPM(ppm)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete PPM</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Garment Plant PPM Standards:</span>
              </span>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Overlock loopers & SNLS rotary hooks require oil clearance checks every 160 operational hours to prevent skipped stitching on knit fabrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
