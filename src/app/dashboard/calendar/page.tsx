'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCheck,
  UserCheck,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  BellRing,
} from 'lucide-react';
import { RepairTicket, Machine, SparePart } from '@/types/cmms';
import {
  subscribeRepairs,
  subscribeMachines,
  subscribeParts,
  resolveRepairTicket,
} from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function CalendarPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  // Resolve modal state
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(30);
  const [actionTaken, setActionTaken] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubR = subscribeRepairs((data) => setRepairs(data));
    const unsubM = subscribeMachines((data) => setMachines(data));
    const unsubP = subscribeParts((data) => setSpareParts(data));

    return () => {
      unsubR();
      unsubM();
      unsubP();
    };
  }, []);

  const pendingTickets = useMemo(() => {
    return repairs.filter((r) => r.status !== 'COMPLETED');
  }, [repairs]);

  const criticalCount = useMemo(() => {
    return pendingTickets.filter((r) => r.urgency === 'CRITICAL').length;
  }, [pendingTickets]);

  const weekDays = [
    { day: 'Mon', date: 'Sep 21', count: pendingTickets.length, today: true },
    { day: 'Tue', date: 'Sep 22', count: 1, today: false },
    { day: 'Wed', date: 'Sep 23', count: 0, today: false },
    { day: 'Thu', date: 'Sep 24', count: 2, today: false },
    { day: 'Fri', date: 'Sep 25', count: 1, today: false },
    { day: 'Sat', date: 'Sep 26', count: 0, today: false },
    { day: 'Sun', date: 'Sep 27', count: 0, today: false },
  ];

  const handleOpenResolveModal = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setDowntimeMinutes(ticket.urgency === 'CRITICAL' ? 35 : 20);
    setActionTaken('');
    setSelectedPartId('');
    setSelectedPartQty(1);
    setIsResolveOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSubmitting(true);

    try {
      const partsUsedList: Array<{ partId: string; quantity: number }> = [];
      if (selectedPartId && selectedPartQty > 0) {
        partsUsedList.push({ partId: selectedPartId, quantity: selectedPartQty });
      }

      await resolveRepairTicket(
        selectedTicket.id,
        downtimeMinutes,
        actionTaken.trim() || 'Adjusted clearance and lubricated moving parts.',
        user?.name || 'Ramesh Kumar',
        partsUsedList
      );

      showToast(
        `Machine ${selectedTicket.machineId} returned to service! Inventory updated atomically.`,
        'success'
      );
      setIsResolveOpen(false);
      setSelectedTicket(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error resolving ticket: ${msg}`, 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <span>Mechanic Daily Work Calendar & Shift Queue</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mechanic workbench. Review live breakdown tickets, open repair modals, consume spare parts, and return machines to active service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 mr-2 rounded-full bg-rose-600 animate-ping" />
            <span>
              {criticalCount > 0
                ? `${criticalCount} Critical Line Stoppage${criticalCount > 1 ? 's' : ''}`
                : 'All Lines Operational'}
            </span>
          </span>
        </div>
      </div>

      {/* Visual 7-Day Shift Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            Weekly Schedule Overview • Current Production Cycle
          </span>
          <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            Shift A: 07:00 - 15:30
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map((d) => (
            <div
              key={d.day}
              className={`p-2.5 rounded-xl border text-center transition ${
                d.today
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase ${
                  d.today ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                {d.day}
              </span>
              <div className="text-xs font-extrabold text-slate-800 my-0.5">{d.date}</div>
              <span
                className={`inline-block px-2 py-0.2 text-[9px] font-bold rounded-full ${
                  d.count > 0
                    ? d.today
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                    : 'text-slate-400 bg-slate-100'
                }`}
              >
                {d.count > 0 ? `${d.count} Jobs` : 'Clear'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Work Tickets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-500" />
            <span>Active Dispatch Tickets & Daily Tasks</span>
          </h3>
          <div className="text-xs text-slate-500">
            Tickets sync immediately when QR tags are scanned on the floor
          </div>
        </div>

        {pendingTickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">All Lines Clear</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No active breakdown tickets or pending routine repair orders in the queue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingTickets.map((t) => {
              const machine = machines.find((m) => m.id === t.machineId);
              const isCritical = t.urgency === 'CRITICAL';

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm space-y-3 relative overflow-hidden transition hover:shadow-md ${
                    isCritical
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 urgent-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.urgency} • {t.faultCategory}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {t.reportedAt ? new Date(t.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>

                  <div>
                    <div className="font-extrabold text-sm text-slate-900 font-mono">{t.machineId}</div>
                    <div className="text-xs font-semibold text-indigo-700">
                      {machine ? `${machine.brand} • ${machine.model} (${machine.type})` : t.machineType}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Location:{' '}
                      <span className="font-semibold text-slate-700">
                        {machine?.currentLine || t.line} ({machine?.stationNo || 'Station'})
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{t.faultCategory}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{t.faultDetails}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Reported by: <span className="font-semibold text-slate-700">{t.reportedBy}</span>
                    </span>
                    <button
                      onClick={() => handleOpenResolveModal(t)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Attend & Fix</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attend & Resolve Modal Workflow */}
      {isResolveOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Resolve Ticket & Log Spare Parts</h4>
                  <p className="text-[10px] text-slate-400">Ticket #{selectedTicket.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResolveOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-5 space-y-4">
              {/* Ticket details banner */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{selectedTicket.machineId} ({selectedTicket.machineType})</span>
                  <span className="text-rose-600">{selectedTicket.faultCategory}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Location: {selectedTicket.line} • {selectedTicket.faultDetails}
                </div>
              </div>

              {/* Downtime & Attending Mechanic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Downtime Spent (Mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={downtimeMinutes}
                    onChange={(e) => setDowntimeMinutes(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Attending Mechanic
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || 'Ramesh Kumar'}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Root Cause & Action Taken *
                </label>
                <textarea
                  required
                  rows={2}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Realigned upper looper clearance to 0.05mm, buffed feed dog edge, and oiled hook..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                />
              </div>

              {/* Spare Parts Consumed Section (Decrements Page 2 Inventory!) */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Spare Parts Consumed
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    Auto-decrements Inventory
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                    >
                      <option value="">None / No parts replaced</option>
                      {spareParts.map((p) => (
                        <option key={p.partId} value={p.partId}>
                          {p.name} (Stock: {p.stock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={selectedPartQty}
                      onChange={(e) => setSelectedPartQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold"
                      placeholder="Qty"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Atomic transaction updates repair ticket, deducts stock, and marks machine ACTIVE.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Complete Repair & Put In-Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
