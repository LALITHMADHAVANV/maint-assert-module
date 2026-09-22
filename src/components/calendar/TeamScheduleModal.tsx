'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck,
  UserX,
  Printer,
  ArrowRightLeft,
  Plus,
  X,
  Phone,
  Layers,
  MapPin,
  CheckCheck,
} from 'lucide-react';
import { RepairTicket, PPMSchedule, Machine } from '@/types/cmms';
import { assignRepairTicket, completePPMTask } from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export interface MechanicDuty {
  id: string;
  name: string;
  role: string;
  shift: string;
  specialty: string;
  assignedLines: string;
  status: 'ON_DUTY' | 'STANDBY' | 'ON_LEAVE';
  phone: string;
  avatarColor: string;
}

export const FACTORY_MECHANICS_ROSTER: MechanicDuty[] = [
  {
    id: 'MEC-01',
    name: 'Ramesh Kumar',
    role: 'Senior Master Mechanic (Lead)',
    shift: 'Shift A (07:00 - 15:30)',
    specialty: 'Heavy Lockstitch, Looper Timing & Feed Calibration',
    assignedLines: 'Plant-wide Lead • Lines A & B',
    status: 'ON_DUTY',
    phone: '+91 98401 23451',
    avatarColor: 'bg-indigo-600 text-white',
  },
  {
    id: 'MEC-08',
    name: 'Suresh Babu',
    role: 'Line Sewing Mechanic',
    shift: 'Shift A (07:00 - 15:30)',
    specialty: 'Single Needle Lockstitch (SNLS) & Tension Balances',
    assignedLines: 'Line A (Station 01 to 08)',
    status: 'ON_DUTY',
    phone: '+91 98401 23452',
    avatarColor: 'bg-amber-600 text-white',
  },
  {
    id: 'MEC-12',
    name: 'Praveen Raj',
    role: 'Line Overlock Specialist',
    shift: 'Shift A (07:00 - 15:30)',
    specialty: '4-Thread & 5-Thread Safety Stitch Overlocks',
    assignedLines: 'Line B (Station 01 to 08)',
    status: 'ON_DUTY',
    phone: '+91 98401 23453',
    avatarColor: 'bg-blue-600 text-white',
  },
  {
    id: 'MEC-15',
    name: 'Anand Kumar',
    role: 'Electronics & Direct-Drive Servo Tech',
    shift: 'Shift B (15:30 - 23:00)',
    specialty: 'Direct-Drive Motors, PCBs & Solenoids',
    assignedLines: 'Lines C & D • Electronics Lab',
    status: 'ON_DUTY',
    phone: '+91 98401 23454',
    avatarColor: 'bg-purple-600 text-white',
  },
  {
    id: 'MEC-04',
    name: 'M. Selvam',
    role: 'Preventive Maintenance (PPM) Tech',
    shift: 'Shift A (07:00 - 15:30)',
    specialty: 'Lubrication Siphons, Wick Flushing & Filter Mesh',
    assignedLines: 'Fleet-wide PPM Servicing',
    status: 'ON_DUTY',
    phone: '+91 98401 23455',
    avatarColor: 'bg-emerald-600 text-white',
  },
];

interface TeamScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // 'YYYY-MM-DD'
  onDateChange: (newDate: string) => void;
  repairs: RepairTicket[];
  ppmSchedules: PPMSchedule[];
  machines: Machine[];
  onOpenResolveModal?: (ticket: RepairTicket) => void;
}

export function TeamScheduleModal({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  repairs,
  ppmSchedules,
  machines,
  onOpenResolveModal,
}: TeamScheduleModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  // Format active date
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Step dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  // Filter tasks for this selected date
  const dayRepairs = repairs.filter((r) => {
    const repDate = r.reportedAt?.slice(0, 10);
    const resDate = r.resolvedAt?.slice(0, 10);
    return repDate === selectedDate || resDate === selectedDate;
  });

  const dayPpms = ppmSchedules.filter((p) => p.nextDue?.slice(0, 10) === selectedDate);

  // Unassigned breakdown tickets on this date
  const unassignedRepairs = dayRepairs.filter(
    (r) => !r.attendedBy || r.attendedBy.trim() === ''
  );

  // Group work by mechanic
  const mechanicWorkData = FACTORY_MECHANICS_ROSTER.map((mech) => {
    // Tickets attended or assigned to this mechanic
    const assignedTickets = dayRepairs.filter(
      (r) => r.attendedBy && r.attendedBy.toLowerCase().includes(mech.name.toLowerCase())
    );

    // PPM tasks: M. Selvam gets PPM tasks by default, or Senior Mechanic Ramesh oversees
    const assignedPpm = dayPpms.filter((p) => {
      if (mech.id === 'MEC-04') return true; // M. Selvam is dedicated PPM tech
      if (mech.id === 'MEC-01' && dayPpms.length > 2) return true; // Ramesh oversees heavy overhauls
      return false;
    });

    const totalDowntime = assignedTickets.reduce(
      (acc, t) => acc + (t.downtimeMinutes || 0),
      0
    );
    const hasCritical = assignedTickets.some(
      (t) => t.urgency === 'CRITICAL' && t.status !== 'COMPLETED'
    );
    const completedCount = assignedTickets.filter((t) => t.status === 'COMPLETED').length;

    return {
      mechanic: mech,
      tickets: assignedTickets,
      ppms: assignedPpm,
      totalJobs: assignedTickets.length + assignedPpm.length,
      totalDowntime,
      hasCritical,
      completedCount,
    };
  });

  // Reassign ticket to another mechanic
  const handleReassign = async (ticketId: string, targetMechanicName: string) => {
    try {
      await assignRepairTicket(ticketId, targetMechanicName);
      showToast(`Work ticket ${ticketId} reassigned to ${targetMechanicName}!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Error reassigning work ticket.', 'error');
    }
  };

  // Complete PPM task directly
  const handlePpmComplete = async (ppmId: string, task: string, machineId: string) => {
    try {
      await completePPMTask(ppmId, user?.name || 'Ramesh Kumar');
      showToast(`Completed PPM service for ${machineId}: ${task}`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Error marking PPM complete', 'error');
    }
  };

  // Print Roster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:static print:p-0 print:bg-white print-modal-overlay">
      <div className="bg-slate-50 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:w-full print:border-none print:shadow-none print:bg-white print:rounded-none print:overflow-visible print-modal-container">
        
        {/* Printed Document Header */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                TexTech Apparel Group &bull; Unit 03 Coimbatore
              </div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                Senior Mechanic Duty Roster &amp; Dispatch Board
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Maintenance &amp; PPM Schedule &bull; Notice Board Release
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-950 font-mono">Date: {formattedDate}</div>
              <div className="text-[10px] text-slate-600">Generated for factory technicians</div>
            </div>
          </div>
        </div>

        {/* Modal Top Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Senior Mechanic Duty Roster & Dispatch Board
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Senior Mechanic Desk
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live oversight of all mechanics&apos; scheduled work, breakdown tickets, and PPM assignments on any selected date.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Print Daily Shift Roster for Notice Board"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Roster</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector & Day Stepper Toolbar */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          {/* Day Navigation Controls */}
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

            {/* Quick Native Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
            />
          </div>

          {/* Quick Filter: All vs Specific Mechanic */}
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

        {/* Unassigned Work Alert Strip (if any breakdown has no technician) */}
        {unassignedRepairs.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-900 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="font-bold">
                ⚠️ {unassignedRepairs.length} Unassigned Breakdown Ticket{unassignedRepairs.length > 1 ? 's' : ''} on {selectedDate}:
              </span>
              <span className="text-rose-700">
                {unassignedRepairs.map((r) => `${r.machineId} (${r.faultCategory})`).join(', ')}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-rose-600">
              Assign to available mechanics below ⬇️
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary KPI Strip for this Day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Technicians
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                  5 On Floor
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between bg-rose-50/20">
              <div>
                <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  Breakdown Tickets
                </div>
                <div className="text-xl font-extrabold text-rose-700 mt-0.5">
                  {dayRepairs.length} Work Orders
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between bg-blue-50/20">
              <div>
                <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Scheduled PPMs
                </div>
                <div className="text-xl font-extrabold text-blue-700 mt-0.5">
                  {dayPpms.length} Overhauls
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between bg-emerald-50/20">
              <div>
                <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Total Completed
                </div>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  {dayRepairs.filter((r) => r.status === 'COMPLETED').length} Fixed
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Mechanic-by-Mechanic Roster Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>Mechanic Work Stations & Assigned Floor Tasks</span>
              <span className="text-[11px] font-normal text-slate-400">
                (Click &apos;Reassign&apos; to rebalance floor load)
              </span>
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mechanicWorkData
                .filter(
                  (item) =>
                    selectedMechanicFilter === 'ALL' ||
                    item.mechanic.name === selectedMechanicFilter
                )
                .map(({ mechanic, tickets, ppms, totalJobs, totalDowntime, hasCritical, completedCount }) => {
                  return (
                    <div
                      key={mechanic.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                    >
                      {/* Mechanic Card Header */}
                      <div className="p-4 bg-slate-50/90 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-sm ${mechanic.avatarColor}`}
                            >
                              {mechanic.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-extrabold text-slate-900">
                                  {mechanic.name}
                                </h5>
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
                              {totalJobs} {totalJobs === 1 ? 'Job' : 'Jobs'} Scheduled
                            </span>
                          </div>
                        </div>

                        {/* Specialty & Location Strip */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-slate-700">{mechanic.assignedLines}</span>
                          </span>
                          <span className="font-medium text-slate-600">{mechanic.specialty}</span>
                        </div>
                      </div>

                      {/* Work Tasks for this Mechanic on Selected Date */}
                      <div className="p-4 space-y-3 flex-1">
                        {totalJobs === 0 ? (
                          <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-1.5">
                            <UserCheck className="w-6 h-6 text-slate-400 mx-auto" />
                            <div className="text-xs font-bold text-slate-700">Available on Floor</div>
                            <p className="text-[11px] text-slate-400">
                              No active repair tickets or routine PPMs assigned to {mechanic.name} on this date.
                            </p>

                            {/* Option for Senior Mechanic to assign unassigned tickets to this mechanic */}
                            {unassignedRepairs.length > 0 && (
                              <div className="pt-2">
                                <span className="text-[10px] font-bold text-indigo-700 block mb-1">
                                  Assign Open Ticket:
                                </span>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {unassignedRepairs.map((ur) => (
                                    <button
                                      key={ur.id}
                                      onClick={() => handleReassign(ur.id, mechanic.name)}
                                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-lg border border-indigo-200 transition cursor-pointer"
                                    >
                                      + {ur.machineId} (#{ur.id})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {/* 1. Breakdown Work Tickets */}
                            {tickets.map((t) => {
                              const isCrit = t.urgency === 'CRITICAL';
                              const isDone = t.status === 'COMPLETED';

                              return (
                                <div
                                  key={t.id}
                                  className={`p-3 rounded-xl border text-xs space-y-2 transition ${
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
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCheck className="w-3 h-3" />
                                        <span>{t.downtimeMinutes}m Downtime</span>
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                                    {t.faultDetails}
                                  </p>

                                  {/* Senior Mechanic Dispatch & Reassign Bar */}
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                                    {!isDone && onOpenResolveModal && (
                                      <button
                                        onClick={() => onOpenResolveModal(t)}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <Wrench className="w-3 h-3" />
                                        <span>Attend</span>
                                      </button>
                                    )}

                                    {/* Reassign Ticket Dropdown */}
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
                                        className="text-[10px] bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-700 outline-none cursor-pointer"
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

                            {/* 2. PPM Overhaul Tasks */}
                            {ppms.map((ppm) => (
                              <div
                                key={ppm.id}
                                className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                    PPM • {ppm.frequency}
                                  </span>
                                  <span className="text-[10px] text-blue-700 font-bold">
                                    Every {ppm.intervalDays} Days
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
                                    Last: {ppm.lastServiced}
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

                      {/* Card Footer Summary */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{mechanic.phone}</span>
                        </span>
                        <span className="font-semibold text-slate-700">
                          {completedCount} Fixed • {tickets.length - completedCount} Active
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Senior Mechanic Shift Supervisory Control • Syncs directly with Cloud Firestore.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Roster Board
          </button>
        </div>
      </div>
    </div>
  );
}
