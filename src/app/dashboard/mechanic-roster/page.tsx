'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Printer,
  ArrowRightLeft,
  Phone,
  MapPin,
  CheckCheck,
  UserCheck,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { RepairTicket, PPMSchedule, Machine } from '@/types/cmms';
import {
  subscribeRepairs,
  subscribeMachines,
  subscribePPMSchedules,
  assignRepairTicket,
  completePPMTask,
} from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  FACTORY_MECHANICS_ROSTER,
} from '@/components/calendar/TeamScheduleModal';

// Helper to format Date to 'YYYY-MM-DD'
function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MechanicRosterPage() {
  const { showToast } = useToast();
  const { user, role } = useAuth();

  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [ppmSchedules, setPpmSchedules] = useState<PPMSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(new Date()));
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState<string>('ALL');

  const isSeniorMechanicOrAdmin =
    role === 'SENIOR_MECHANIC' || role === 'ADMIN' || role === 'ASSET_MANAGER';

  useEffect(() => {
    const unsubR = subscribeRepairs((data) => setRepairs(data));
    const unsubM = subscribeMachines((data) => setMachines(data));
    const unsubPPM = subscribePPMSchedules((data) => setPpmSchedules(data));

    return () => {
      unsubR();
      unsubM();
      unsubPPM();
    };
  }, []);

  // Format active date
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateKey(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDateKey(d));
  };

  const handleToday = () => {
    setSelectedDate(toDateKey(new Date()));
  };

  // Filter tasks for this selected date
  const dayRepairs = repairs.filter((r) => {
    const repDate = r.reportedAt?.slice(0, 10);
    const resDate = r.resolvedAt?.slice(0, 10);
    return repDate === selectedDate || resDate === selectedDate;
  });

  const dayPpms = ppmSchedules.filter((p) => p.nextDue?.slice(0, 10) === selectedDate);

  const unassignedRepairs = dayRepairs.filter(
    (r) => !r.attendedBy || r.attendedBy.trim() === ''
  );

  // Group work by mechanic
  const mechanicWorkData = FACTORY_MECHANICS_ROSTER.map((mech) => {
    const assignedTickets = dayRepairs.filter(
      (r) => r.attendedBy && r.attendedBy.toLowerCase().includes(mech.name.toLowerCase())
    );

    const assignedPpm = dayPpms.filter((p) => {
      if (mech.id === 'MEC-04') return true;
      if (mech.id === 'MEC-01' && dayPpms.length > 2) return true;
      return false;
    });

    const completedCount = assignedTickets.filter((t) => t.status === 'COMPLETED').length;

    return {
      mechanic: mech,
      tickets: assignedTickets,
      ppms: assignedPpm,
      totalJobs: assignedTickets.length + assignedPpm.length,
      completedCount,
    };
  });

  const handleReassign = async (ticketId: string, targetMechanicName: string) => {
    try {
      await assignRepairTicket(ticketId, targetMechanicName);
      showToast(`Work ticket ${ticketId} reassigned to ${targetMechanicName}!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Error reassigning work ticket.', 'error');
    }
  };

  const handlePpmComplete = async (ppmId: string, task: string, machineId: string) => {
    try {
      await completePPMTask(ppmId, user?.name || 'Ramesh Kumar');
      showToast(`Completed PPM service for ${machineId}: ${task}`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Error marking PPM complete', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
      {/* Official Factory Shift Sheet Header (Printed Notice Board Format) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
              TexTech Apparel Group &bull; Unit 03 Coimbatore
            </div>
            <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
              Daily Master Mechanic Duty Allocation &amp; Floor Shift Sheet
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Maintenance &amp; Mechanical Engineering Division &bull; Notice Board Release
            </p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-950 font-mono">Date: {formattedDate}</div>
            <div className="text-[10px] text-slate-600">Supervisor: {user?.name || 'Ramesh Kumar (Master Tech)'}</div>
            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black bg-slate-900 text-white rounded uppercase">
              Shift: Day (08:00 - 17:30)
            </span>
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard/calendar"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-400/30 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Monthly Calendar</span>
              </Link>
              <span className="text-xs text-indigo-300 font-mono">
                {user?.name || 'Ramesh Kumar'} ({role || 'SENIOR_MECHANIC'})
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-400" />
              <span>Senior Mechanic Duty Roster & Work Allocation</span>
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">
              Inspect everyone&apos;s scheduled work for any date. Track breakdown job allocations, rebalance floor load, and supervise preventive overhauls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Daily Shift Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Stepper Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white">
            <button
              onClick={handlePrevDay}
              aria-label="Previous Day"
              className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-l-xl transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-slate-900 min-w-[200px] text-center select-none flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{formattedDate}</span>
            </span>
            <button
              onClick={handleNextDay}
              aria-label="Next Day"
              className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-r-xl transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Mechanic:</span>
          <select
            value={selectedMechanicFilter}
            onChange={(e) => setSelectedMechanicFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none"
          >
            <option value="ALL">All 5 Factory Technicians</option>
            {FACTORY_MECHANICS_ROSTER.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.role.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unassigned Work Alert Strip */}
      {unassignedRepairs.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span className="font-bold">
              ⚠️ {unassignedRepairs.length} Unassigned Breakdown Ticket{unassignedRepairs.length > 1 ? 's' : ''} on {selectedDate}:
            </span>
            <span className="text-rose-700 font-semibold">
              {unassignedRepairs.map((r) => `${r.machineId} (${r.faultCategory})`).join(', ')}
            </span>
          </div>
          <div className="text-[11px] font-semibold text-rose-600">
            Assign to mechanics below ⬇️
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technicians on Duty</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">5 On Floor</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between bg-rose-50/20">
          <div>
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Breakdown Jobs</div>
            <div className="text-xl font-extrabold text-rose-700 mt-0.5">{dayRepairs.length} Tickets</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm flex items-center justify-between bg-blue-50/20">
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">PPM Overhauls</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">{dayPpms.length} Due</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
          <div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed Fixes</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
              {dayRepairs.filter((r) => r.status === 'COMPLETED').length} Fixed
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {mechanicWorkData
          .filter(
            (item) =>
              selectedMechanicFilter === 'ALL' ||
              item.mechanic.name === selectedMechanicFilter
          )
          .map(({ mechanic, tickets, ppms, totalJobs, completedCount }) => (
            <div
              key={mechanic.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 bg-slate-50/90 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base shadow-sm ${mechanic.avatarColor}`}
                    >
                      {mechanic.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {mechanic.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {mechanic.status}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                        {mechanic.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {mechanic.shift}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {totalJobs} {totalJobs === 1 ? 'Job' : 'Jobs'} Assigned
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{mechanic.assignedLines}</span>
                  </span>
                  <span className="font-medium text-slate-600">{mechanic.specialty}</span>
                </div>
              </div>

              {/* Work Items */}
              <div className="p-5 space-y-3 flex-1">
                {totalJobs === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <UserCheck className="w-7 h-7 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">Available on Shift</div>
                    <p className="text-[11px] text-slate-400">
                      No breakdown tickets or preventive overhauls currently assigned for {selectedDate}.
                    </p>

                    {unassignedRepairs.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-indigo-700 block mb-1">
                          Assign Open Ticket:
                        </span>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {unassignedRepairs.map((ur) => (
                            <button
                              key={ur.id}
                              onClick={() => handleReassign(ur.id, mechanic.name)}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-lg border border-indigo-200 transition cursor-pointer"
                            >
                              + {ur.machineId} (#{ur.id})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Breakdown tickets */}
                    {tickets.map((t) => {
                      const isCrit = t.urgency === 'CRITICAL';
                      const isDone = t.status === 'COMPLETED';

                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                            isDone
                              ? 'bg-slate-50 border-slate-200 opacity-80'
                              : isCrit
                              ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200'
                              : 'bg-amber-50/40 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCrit
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isDone ? 'RESOLVED' : t.urgency} • {t.faultCategory}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{t.id}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 font-mono">
                                {t.machineId}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Location: <span className="font-semibold text-indigo-700">{t.line}</span>
                              </div>
                            </div>
                            {isDone && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                <span>{t.downtimeMinutes}m Downtime</span>
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                            {t.faultDetails}
                          </p>

                          {/* Reassign action */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-[10px] text-slate-400">
                              Reported by: {t.reportedBy}
                            </span>

                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Reassign:</span>
                              </span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleReassign(t.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="" disabled>
                                  Move to...
                                </option>
                                {FACTORY_MECHANICS_ROSTER.filter((m) => m.name !== mechanic.name).map((m) => (
                                  <option key={m.id} value={m.name}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* PPM Overhauls */}
                    {ppms.map((ppm) => (
                      <div
                        key={ppm.id}
                        className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            PPM • {ppm.frequency}
                          </span>
                          <span className="text-[10px] text-blue-700 font-bold">
                            Interval: {ppm.intervalDays} Days
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-sm text-slate-900 font-mono">
                            {ppm.machineId}
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                            {ppm.task}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500">
                            Due Date: {ppm.nextDue}
                          </span>
                          <button
                            onClick={() => handlePpmComplete(ppm.id, ppm.task, ppm.machineId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Complete PPM</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 print:bg-white">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{mechanic.phone}</span>
                </span>
                <span className="font-semibold text-slate-700">
                  {completedCount} Resolved • {tickets.length - completedCount} In Progress
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Printed Roster Sign-Off Footer */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-8 mt-8 border-t-2 border-slate-900 text-xs print-break-inside-avoid">
        <div>
          <div className="font-bold text-slate-900">Shift Supervisor:</div>
          <div className="border-b border-slate-400 mt-8" />
          <div className="text-[10px] text-slate-500 mt-1">Signature &amp; Time</div>
        </div>
        <div>
          <div className="font-bold text-slate-900">Master Mechanic In-Charge:</div>
          <div className="border-b border-slate-400 mt-8" />
          <div className="text-[10px] text-slate-500 mt-1">Signature &amp; Work Verified</div>
        </div>
        <div>
          <div className="font-bold text-slate-900">Plant Maintenance Engineer:</div>
          <div className="border-b border-slate-400 mt-8" />
          <div className="text-[10px] text-slate-500 mt-1">Audit Approval &amp; File</div>
        </div>
      </div>
    </div>
  );
}
