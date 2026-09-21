'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCheck,
  CheckCircle2,
  X,
  Plus,
  BellRing,
  Filter,
  Layers,
  ListOrdered,
  CalendarRange,
  Flame,
  ShieldCheck,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { RepairTicket, Machine, SparePart, PPMSchedule } from '@/types/cmms';
import {
  subscribeRepairs,
  subscribeMachines,
  subscribeParts,
  subscribePPMSchedules,
  resolveRepairTicket,
  completePPMTask,
  createPPMSchedule,
} from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

// Helper to format Date to 'YYYY-MM-DD'
function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const { showToast } = useToast();
  const { user, role } = useAuth();

  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [ppmSchedules, setPpmSchedules] = useState<PPMSchedule[]>([]);

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(new Date()));
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'REPAIRS' | 'PPM' | 'COMPLETED'>('ALL');

  // Senior Mechanic & Admin have authority to schedule new PPM overhauls
  const canSchedulePPM = role === 'SENIOR_MECHANIC' || role === 'ADMIN' || role === 'ASSET_MANAGER';

  // Resolve Repair modal state
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(30);
  const [actionTaken, setActionTaken] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New PPM Schedule modal state
  const [isSchedulePPMOpen, setIsSchedulePPMOpen] = useState(false);
  const [newPPMMachineId, setNewPPMMachineId] = useState('');
  const [newPPMTask, setNewPPMTask] = useState('');
  const [newPPMFrequency, setNewPPMFrequency] = useState<'Weekly' | 'Monthly' | '6-Month'>('Monthly');
  const [newPPMDueDate, setNewPPMDueDate] = useState<string>(() => toDateKey(new Date()));
  const [isCreatingPPM, setIsCreatingPPM] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    const unsubR = subscribeRepairs((data) => setRepairs(data));
    const unsubM = subscribeMachines((data) => setMachines(data));
    const unsubP = subscribeParts((data) => setSpareParts(data));
    const unsubPPM = subscribePPMSchedules((data) => setPpmSchedules(data));

    return () => {
      unsubR();
      unsubM();
      unsubP();
      unsubPPM();
    };
  }, []);

  // Set default machine for PPM schedule modal once machines load
  useEffect(() => {
    if (machines.length > 0 && !newPPMMachineId) {
      setNewPPMMachineId(machines[0].id);
    }
  }, [machines, newPPMMachineId]);

  // Sync modal date when selectedDate changes
  useEffect(() => {
    setNewPPMDueDate(selectedDate);
  }, [selectedDate]);

  // Derived current month information
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[month]} ${year}`;

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  // Events grouped by date string ('YYYY-MM-DD')
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { repairs: RepairTicket[]; ppms: PPMSchedule[] }>();

    const getBucket = (key: string) => {
      if (!map.has(key)) {
        map.set(key, { repairs: [], ppms: [] });
      }
      return map.get(key)!;
    };

    // Index repairs by reportedAt and resolvedAt
    for (const r of repairs) {
      const dateKey = r.reportedAt?.slice(0, 10);
      if (dateKey) {
        getBucket(dateKey).repairs.push(r);
      }
      // Also index resolved date if different and resolved
      if (r.status === 'COMPLETED' && r.resolvedAt) {
        const resKey = r.resolvedAt.slice(0, 10);
        if (resKey && resKey !== dateKey) {
          getBucket(resKey).repairs.push(r);
        }
      }
    }

    // Index PPMs by nextDue
    for (const ppm of ppmSchedules) {
      const dateKey = ppm.nextDue?.slice(0, 10);
      if (dateKey) {
        getBucket(dateKey).ppms.push(ppm);
      }
    }

    return map;
  }, [repairs, ppmSchedules]);

  // Monthly KPI Statistics
  const stats = useMemo(() => {
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthRepairs = repairs.filter(
      (r) => r.reportedAt?.startsWith(currentMonthPrefix) || r.resolvedAt?.startsWith(currentMonthPrefix)
    );
    const monthPPMs = ppmSchedules.filter((p) => p.nextDue?.startsWith(currentMonthPrefix));

    const critical = monthRepairs.filter((r) => r.urgency === 'CRITICAL' && r.status !== 'COMPLETED').length;
    const completed = monthRepairs.filter((r) => r.status === 'COMPLETED').length;
    const dueSoonPPM = monthPPMs.filter((p) => p.status === 'DUE_SOON' || p.status === 'OVERDUE').length;

    return {
      totalMonthJobs: monthRepairs.length + monthPPMs.length,
      critical,
      completed,
      dueSoonPPM,
      totalPPM: monthPPMs.length,
    };
  }, [repairs, ppmSchedules, year, month]);

  // Calendar matrix generator (42 cells: 6 weeks x 7 days)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      date: Date;
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isWeekend: boolean;
      repairs: RepairTicket[];
      ppms: PPMSchedule[];
      hasCritical: boolean;
    }> = [];

    // 1. Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dKey = toDateKey(d);
      const b = eventsByDate.get(dKey) || { repairs: [], ppms: [] };
      const hasCrit = b.repairs.some((r) => r.urgency === 'CRITICAL' && r.status !== 'COMPLETED');

      cells.push({
        date: d,
        dateString: dKey,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dKey === todayKey,
        isSelected: dKey === selectedDate,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        repairs: b.repairs,
        ppms: b.ppms,
        hasCritical: hasCrit,
      });
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dKey = toDateKey(d);
      const b = eventsByDate.get(dKey) || { repairs: [], ppms: [] };
      const hasCrit = b.repairs.some((r) => r.urgency === 'CRITICAL' && r.status !== 'COMPLETED');

      cells.push({
        date: d,
        dateString: dKey,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dKey === todayKey,
        isSelected: dKey === selectedDate,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        repairs: b.repairs,
        ppms: b.ppms,
        hasCritical: hasCrit,
      });
    }

    // 3. Next month leading days to complete 42 cells (uniform 6 rows)
    const remaining = 42 - cells.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const dKey = toDateKey(d);
      const b = eventsByDate.get(dKey) || { repairs: [], ppms: [] };
      const hasCrit = b.repairs.some((r) => r.urgency === 'CRITICAL' && r.status !== 'COMPLETED');

      cells.push({
        date: d,
        dateString: dKey,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dKey === todayKey,
        isSelected: dKey === selectedDate,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        repairs: b.repairs,
        ppms: b.ppms,
        hasCritical: hasCrit,
      });
    }

    return cells;
  }, [year, month, eventsByDate, todayKey, selectedDate]);

  // Selected date events & details
  const selectedDayData = useMemo(() => {
    const bucket = eventsByDate.get(selectedDate) || { repairs: [], ppms: [] };
    const dateObj = new Date(selectedDate + 'T00:00:00');

    let filteredRepairs = bucket.repairs;
    let filteredPpms = bucket.ppms;

    if (filterType === 'CRITICAL') {
      filteredRepairs = filteredRepairs.filter((r) => r.urgency === 'CRITICAL');
      filteredPpms = [];
    } else if (filterType === 'REPAIRS') {
      filteredPpms = [];
    } else if (filterType === 'PPM') {
      filteredRepairs = [];
    } else if (filterType === 'COMPLETED') {
      filteredRepairs = filteredRepairs.filter((r) => r.status === 'COMPLETED');
      filteredPpms = filteredPpms.filter((p) => p.status === 'COMPLETED');
    }

    return {
      dateString: selectedDate,
      dateFormatted: dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      isToday: selectedDate === todayKey,
      repairs: filteredRepairs,
      ppms: filteredPpms,
      totalCount: filteredRepairs.length + filteredPpms.length,
    };
  }, [selectedDate, eventsByDate, filterType, todayKey]);

  // Agenda view items (all events in current month sorted by date)
  const agendaMonthItems = useMemo(() => {
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const grouped = new Map<string, { dateStr: string; dateObj: Date; repairs: RepairTicket[]; ppms: PPMSchedule[] }>();

    for (let dayNum = 1; dayNum <= 31; dayNum++) {
      const dKey = `${currentMonthPrefix}-${String(dayNum).padStart(2, '0')}`;
      const bucket = eventsByDate.get(dKey);
      if (bucket && (bucket.repairs.length > 0 || bucket.ppms.length > 0)) {
        let rep = bucket.repairs;
        let ppm = bucket.ppms;

        if (filterType === 'CRITICAL') {
          rep = rep.filter((r) => r.urgency === 'CRITICAL');
          ppm = [];
        } else if (filterType === 'REPAIRS') {
          ppm = [];
        } else if (filterType === 'PPM') {
          rep = [];
        } else if (filterType === 'COMPLETED') {
          rep = rep.filter((r) => r.status === 'COMPLETED');
          ppm = ppm.filter((p) => p.status === 'COMPLETED');
        }

        if (rep.length > 0 || ppm.length > 0) {
          grouped.set(dKey, {
            dateStr: dKey,
            dateObj: new Date(`${dKey}T00:00:00`),
            repairs: rep,
            ppms: ppm,
          });
        }
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [year, month, eventsByDate, filterType]);

  // Calendar Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(toDateKey(now));
  };

  // Open Resolve Repair Modal
  const handleOpenResolveModal = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setDowntimeMinutes(ticket.urgency === 'CRITICAL' ? 35 : 20);
    setActionTaken('');
    setSelectedPartId('');
    setSelectedPartQty(1);
    setIsResolveOpen(true);
  };

  // Submit Resolve Repair
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
        actionTaken.trim() || 'Adjusted clearance, cleaned lint, and verified stitch balance.',
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

  // One-Click Complete PPM Task
  const handleCompletePPM = async (scheduleId: string, taskName: string, machineId: string) => {
    try {
      await completePPMTask(scheduleId, user?.name || 'Ramesh Kumar');
      showToast(`PPM Task Completed: ${taskName} for ${machineId}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to complete PPM schedule', 'error');
    }
  };

  // Submit New PPM Schedule
  const handleCreatePPMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPPMMachineId || !newPPMTask.trim()) {
      showToast('Please select a machine and enter task details.', 'error');
      return;
    }
    setIsCreatingPPM(true);

    const intervalMap: Record<'Weekly' | 'Monthly' | '6-Month', number> = {
      Weekly: 7,
      Monthly: 30,
      '6-Month': 180,
    };

    const newSchedule: PPMSchedule = {
      id: `PPM-${Date.now().toString().slice(-4)}`,
      machineId: newPPMMachineId,
      task: newPPMTask.trim(),
      intervalDays: intervalMap[newPPMFrequency],
      frequency: newPPMFrequency,
      lastServiced: toDateKey(new Date()),
      nextDue: newPPMDueDate,
      status: 'PENDING',
    };

    try {
      await createPPMSchedule(newSchedule);
      showToast(`Preventive Maintenance Task scheduled for ${newPPMMachineId}!`, 'success');
      setIsSchedulePPMOpen(false);
      setNewPPMTask('');
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule PPM task.', 'error');
    } finally {
      setIsCreatingPPM(false);
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* 1. Cloud Calendar Master Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Mechanic Cloud Calendar & Dispatch</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live Monthly CMMS
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full monthly maintenance planner • Track preventive tasks (PPM), breakdowns, and shift allocations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Schedule Button (Senior Mechanic & Plant Admin only) */}
          <div className="flex items-center flex-wrap gap-2.5">
            {canSchedulePPM && (
              <button
                onClick={() => setIsSchedulePPMOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule PPM Task</span>
              </button>
            )}

            {/* View Mode Toggle (Month vs Agenda) */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-indigo-700 font-bold shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white text-indigo-700 font-bold shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Month Navigation Toolbar & Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Month Selector & Today button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-l-xl transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-extrabold text-slate-900 min-w-[130px] text-center select-none">
                {monthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-r-xl transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Badges (All, Critical, Repairs, PPM, Completed) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {[
              { id: 'ALL', label: 'All Jobs', color: 'slate' },
              { id: 'CRITICAL', label: '🚨 Critical', color: 'rose' },
              { id: 'REPAIRS', label: '🔧 Repairs', color: 'amber' },
              { id: 'PPM', label: '📅 PPM Tasks', color: 'blue' },
              { id: 'COMPLETED', label: '✅ Completed', color: 'emerald' },
            ].map((f) => {
              const active = filterType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as typeof filterType)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Monthly Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month Jobs</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.totalMonthJobs}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between bg-rose-50/20">
          <div>
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              {stats.critical > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
              <span>Critical Active</span>
            </div>
            <div className="text-xl font-extrabold text-rose-700 mt-0.5">{stats.critical}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">PPM Schedules</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">{stats.totalPPM}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed Fixes</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{stats.completed}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Main Body: Full Cloud Calendar Grid or Agenda View */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: The 7-Day / 6-Week Monthly Cloud Grid (lg: 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Weekday column headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/75 text-center text-xs font-bold text-slate-600 py-2.5 select-none">
              {weekdays.map((w, idx) => (
                <div
                  key={w}
                  className={`uppercase tracking-wider ${
                    idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* 42-Cell Monthly Calendar Grid */}
            <div className="grid grid-cols-7 border-b border-r border-slate-200">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateString === selectedDate;
                const isToday = cell.isToday;

                // Filter events based on filterType
                let displayRepairs = cell.repairs;
                let displayPpms = cell.ppms;

                if (filterType === 'CRITICAL') {
                  displayRepairs = displayRepairs.filter((r) => r.urgency === 'CRITICAL');
                  displayPpms = [];
                } else if (filterType === 'REPAIRS') {
                  displayPpms = [];
                } else if (filterType === 'PPM') {
                  displayRepairs = [];
                } else if (filterType === 'COMPLETED') {
                  displayRepairs = displayRepairs.filter((r) => r.status === 'COMPLETED');
                  displayPpms = displayPpms.filter((p) => p.status === 'COMPLETED');
                }

                const totalEvents = displayRepairs.length + displayPpms.length;

                return (
                  <div
                    key={cell.dateString}
                    onClick={() => setSelectedDate(cell.dateString)}
                    className={`min-h-[96px] sm:min-h-[110px] p-1.5 border-t border-l border-slate-200 flex flex-col justify-between transition group cursor-pointer relative ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/50 text-slate-300'
                        : cell.isWeekend
                        ? 'bg-slate-50/20'
                        : 'bg-white'
                    } ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 bg-indigo-50/40 z-10'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                            : isSelected
                            ? 'bg-slate-900 text-white'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-300'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Micro badge for critical line stoppage */}
                      {cell.hasCritical && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" title="Critical Breakdown on this date" />
                      )}
                    </div>

                    {/* Event Chips (Cloud Calendar Style) */}
                    <div className="space-y-1 overflow-hidden flex-1">
                      {/* 1. Critical Breakdown Chips */}
                      {displayRepairs
                        .filter((r) => r.urgency === 'CRITICAL' && r.status !== 'COMPLETED')
                        .slice(0, 2)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-rose-100/90 text-rose-900 border border-rose-300 rounded px-1.5 py-0.5 text-[10px] font-extrabold truncate flex items-center gap-1 shadow-2xs"
                            title={`${r.machineId}: ${r.faultCategory} (${r.urgency})`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                            <span className="truncate">{r.machineId}</span>
                          </div>
                        ))}

                      {/* 2. Warning / Routine Repair Chips */}
                      {displayRepairs
                        .filter((r) => r.urgency !== 'CRITICAL' && r.status !== 'COMPLETED')
                        .slice(0, 2)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.5 text-[10px] font-semibold truncate flex items-center gap-1"
                            title={`${r.machineId}: ${r.faultCategory}`}
                          >
                            <Wrench className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span className="truncate">{r.machineId}</span>
                          </div>
                        ))}

                      {/* 3. PPM Schedule Chips */}
                      {displayPpms.slice(0, 2).map((ppm) => (
                        <div
                          key={ppm.id}
                          className="bg-blue-50 text-blue-900 border border-blue-200 rounded px-1.5 py-0.5 text-[10px] font-semibold truncate flex items-center gap-1"
                          title={`PPM: ${ppm.task} (${ppm.machineId})`}
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                          <span className="truncate">{ppm.machineId}</span>
                        </div>
                      ))}

                      {/* 4. Completed Repair Chips */}
                      {displayRepairs
                        .filter((r) => r.status === 'COMPLETED')
                        .slice(0, 1)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px] font-medium truncate flex items-center gap-1 opacity-75"
                            title={`Completed: ${r.machineId}`}
                          >
                            <CheckCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{r.machineId}</span>
                          </div>
                        ))}

                      {/* "+N More" Chip */}
                      {totalEvents > 2 && (
                        <div className="text-[9px] font-bold text-slate-500 px-1 py-0.2 rounded hover:text-indigo-600 text-center">
                          +{totalEvents - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Legend */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  <span className="font-semibold text-slate-700">Critical Breakdown</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                  <span className="font-semibold text-slate-700">Routine Repair</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                  <span className="font-semibold text-slate-700">PPM Service</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span className="font-semibold text-slate-700">Completed</span>
                </span>
              </div>
              <div className="text-slate-400 italic">
                Click any calendar day to inspect and dispatch tasks.
              </div>
            </div>
          </div>

          {/* Right: Selected Date Agenda / Task Inspector Drawer (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Day Schedule Inspector
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedDayData.dateFormatted}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedDayData.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      TODAY
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedDayData.totalCount} {selectedDayData.totalCount === 1 ? 'Job' : 'Jobs'}
                  </span>
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="mt-4 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {selectedDayData.totalCount === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2.5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-800">No Jobs for this Date</div>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      All sewing machinery on active lines are functioning without pending breakdowns or PPM tasks on this day.
                    </p>
                    {canSchedulePPM && (
                      <button
                        onClick={() => setIsSchedulePPMOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule PPM on this Day</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 1. Repair Tickets for Selected Day */}
                    {selectedDayData.repairs.map((t) => {
                      const machine = machines.find((m) => m.id === t.machineId);
                      const isCritical = t.urgency === 'CRITICAL';
                      const isCompleted = t.status === 'COMPLETED';

                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                            isCompleted
                              ? 'bg-slate-50/70 border-slate-200 opacity-90'
                              : isCritical
                              ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200'
                              : 'bg-amber-50/30 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCritical
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isCompleted ? 'RESOLVED' : t.urgency} • {t.faultCategory}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{t.id}
                            </span>
                          </div>

                          <div>
                            <div className="font-extrabold text-sm text-slate-900 font-mono">
                              {t.machineId}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {machine ? `${machine.brand} ${machine.model}` : t.machineType} •{' '}
                              <span className="text-indigo-700 font-semibold">{t.line}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                            {t.faultDetails}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">
                              By: <span className="text-slate-600 font-medium">{t.reportedBy}</span>
                            </span>

                            {!isCompleted ? (
                              <button
                                onClick={() => handleOpenResolveModal(t)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Attend & Fix</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Fixed in {t.downtimeMinutes}m</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 2. PPM Schedules for Selected Day */}
                    {selectedDayData.ppms.map((ppm) => {
                      const machine = machines.find((m) => m.id === ppm.machineId);

                      return (
                        <div
                          key={ppm.id}
                          className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              PPM • {ppm.frequency}
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold">
                              Interval: {ppm.intervalDays} Days
                            </span>
                          </div>

                          <div>
                            <div className="font-extrabold text-sm text-slate-900 font-mono">
                              {ppm.machineId}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {machine ? `${machine.brand} ${machine.model} (${machine.currentLine})` : 'Line Machine'}
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-blue-100 text-[11px] text-slate-700 font-medium">
                            {ppm.task}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">
                              Due: <span className="font-semibold text-slate-600">{ppm.nextDue}</span>
                            </span>

                            <button
                              onClick={() => handleCompletePPM(ppm.id, ppm.task, ppm.machineId)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Complete PPM</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 5. Agenda View (Chronological Feed) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Monthly Agenda Feed • {monthLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Chronological list of all breakdown work orders and preventive tasks in {monthNames[month]}.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {agendaMonthItems.length} Scheduled Days
            </span>
          </div>

          {agendaMonthItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-slate-800">All Lines Clear for this Month</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active breakdown tickets or upcoming PPM maintenance tasks match your filter.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {agendaMonthItems.map((group) => {
                const isTodayGroup = group.dateStr === todayKey;
                const formattedHeader = group.dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={group.dateStr} className="space-y-3">
                    {/* Date Header Strip */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                          isTodayGroup
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {formattedHeader}
                        {isTodayGroup && ' • TODAY'}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[11px] font-semibold text-slate-400">
                        {group.repairs.length + group.ppms.length} items
                      </span>
                    </div>

                    {/* Events Grid for this Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {/* Repairs */}
                      {group.repairs.map((r) => {
                        const isCritical = r.urgency === 'CRITICAL';
                        const isDone = r.status === 'COMPLETED';

                        return (
                          <div
                            key={r.id}
                            className={`p-4 rounded-xl border shadow-2xs space-y-2.5 ${
                              isDone
                                ? 'bg-slate-50 border-slate-200 opacity-80'
                                : isCritical
                                ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isCritical
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isDone ? 'RESOLVED' : r.urgency} • {r.faultCategory}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">#{r.id}</span>
                            </div>

                            <div>
                              <div className="font-extrabold text-sm text-slate-900 font-mono">{r.machineId}</div>
                              <div className="text-[11px] text-slate-500">
                                {r.machineType} • <span className="font-semibold text-indigo-700">{r.line}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                              {r.faultDetails}
                            </p>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400">Reported by: {r.reportedBy}</span>
                              {!isDone && (
                                <button
                                  onClick={() => handleOpenResolveModal(r)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Wrench className="w-3 h-3" />
                                  <span>Attend</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* PPMs */}
                      {group.ppms.map((ppm) => (
                        <div
                          key={ppm.id}
                          className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              PPM • {ppm.frequency}
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold">Every {ppm.intervalDays}d</span>
                          </div>

                          <div>
                            <div className="font-extrabold text-sm text-slate-900 font-mono">{ppm.machineId}</div>
                            <div className="text-[11px] text-slate-600">{ppm.task}</div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">Due: {ppm.nextDue}</span>
                            <button
                              onClick={() => handleCompletePPM(ppm.id, ppm.task, ppm.machineId)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Attend & Resolve Repair Modal (With Downtime and Spare Parts Inventory Deduction) */}
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
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{selectedTicket.machineId} ({selectedTicket.machineType})</span>
                  <span className="text-rose-600">{selectedTicket.faultCategory}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Location: {selectedTicket.line} • {selectedTicket.faultDetails}
                </div>
              </div>

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

      {/* 7. Schedule Preventive Maintenance (PPM) Modal */}
      {isSchedulePPMOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Schedule Preventive Maintenance</h4>
                  <p className="text-[10px] text-slate-400">Creates recurring PPM task on Cloud Calendar</p>
                </div>
              </div>
              <button
                onClick={() => setIsSchedulePPMOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePPMSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Machine *
                </label>
                <select
                  required
                  value={newPPMMachineId}
                  onChange={(e) => setNewPPMMachineId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.brand} {m.model} ({m.currentLine})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PPM Task Description *
                </label>
                <input
                  type="text"
                  required
                  value={newPPMTask}
                  onChange={(e) => setNewPPMTask(e.target.value)}
                  placeholder="e.g. Monthly Oil Filter Screen Cleaning & Wick Flush"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newPPMFrequency}
                    onChange={(e) => setNewPPMFrequency(e.target.value as typeof newPPMFrequency)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-semibold"
                  >
                    <option value="Weekly">Weekly (7 Days)</option>
                    <option value="Monthly">Monthly (30 Days)</option>
                    <option value="6-Month">Semi-Annual (180 Days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPPMDueDate}
                    onChange={(e) => setNewPPMDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSchedulePPMOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPPM}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create PPM Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
