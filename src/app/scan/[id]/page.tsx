'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  QrCode,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Radio,
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { Machine, FloorLine, RepairUrgency } from '@/types/cmms';
import {
  subscribeMachines,
  createBreakdownTicket,
  relocateMachine,
} from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function MobileScanPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : '';

  const { showToast } = useToast();
  const { user } = useAuth();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'report' | 'relocate'>('report');

  // Breakdown Form
  const [faultType, setFaultType] = useState('Skipping Stitches / Looper Timing Misalignment');
  const [urgency, setUrgency] = useState<RepairUrgency>('CRITICAL');
  const [faultNotes, setFaultNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Relocate Form
  const [targetLine, setTargetLine] = useState<FloorLine>('Line 01');
  const [targetStation, setTargetStation] = useState('');
  const [relocateReason, setRelocateReason] = useState('');

  useEffect(() => {
    const unsub = subscribeMachines((machines) => {
      const found = machines.find((m) => m.id.toLowerCase() === machineId.toLowerCase());
      if (found) {
        setMachine(found);
        setTargetLine(found.currentLine);
        setTargetStation(found.stationNo);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [machineId]);

  const handleBreakdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    setIsSubmitting(true);

    try {
      const ticketId = await createBreakdownTicket({
        machineId: machine.id,
        machineType: machine.typeName || machine.type,
        line: machine.currentLine,
        reportedAt: new Date().toISOString(),
        reportedBy: `${user?.name || 'Floor Operator'} (${user?.title || 'Line'})`,
        faultCategory: faultType,
        faultDetails: faultNotes.trim() || 'Logged via QR sticker scan on production floor.',
        urgency,
      });

      showToast(
        `Critical breakdown #${ticketId} broadcasted to Mechanic Queue for ${machine.id}!`,
        'error'
      );
      setFaultNotes('');
      router.push('/dashboard/calendar');
    } catch (err) {
      showToast('Failed to dispatch breakdown ticket', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    setIsSubmitting(true);

    try {
      await relocateMachine(
        machine.id,
        targetLine,
        targetStation || 'Station 01',
        relocateReason.trim() || 'Floor line balancing',
        user?.name || 'Line Supervisor'
      );

      showToast(`Machine ${machine.id} relocated to ${targetLine} (${targetStation})`, 'success');
      setRelocateReason('');
      router.push('/dashboard/floor-tracker');
    } catch (err) {
      showToast('Failed to relocate machine', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Scanning Asset Tag...</p>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 border border-slate-700 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Unrecognized Asset Tag</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Machine tag <code className="bg-slate-900 px-2 py-1 rounded text-amber-300">{machineId}</code> was not found in the factory registry.
          </p>
          <Link
            href="/dashboard/machines"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Machine Registry</span>
          </Link>
        </div>
      </div>
    );
  }

  const isDown = machine.status === 'BREAKDOWN';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-4 sm:p-6 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Top Header */}
      <div className="max-w-lg w-full mx-auto flex items-center justify-between py-3 border-b border-slate-800 mb-4">
        <Link
          href="/dashboard/machines"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>CMMS Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-slate-300">Floor Terminal Live</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-lg w-full mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Machine Identity Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                SCANNED ASSET
              </div>
              <h1 className="text-2xl font-extrabold font-mono text-white mt-0.5 tracking-tight">
                {machine.id}
              </h1>
              <p className="text-sm font-bold text-indigo-300 mt-0.5">
                {machine.brand} • {machine.model}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isDown
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 urgent-pulse'
                  : machine.status === 'BUFFER'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {machine.status}
            </span>
          </div>

          {/* Machine specs strip */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Class / Type</span>
              <span className="font-semibold text-slate-200 truncate block">
                {machine.typeName || machine.type}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Current Line</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {machine.currentLine} ({machine.stationNo})
              </span>
            </div>
          </div>
        </div>

        {/* Action Tabs: Report vs Relocate */}
        <div className="flex border-b border-slate-800 text-xs font-bold bg-slate-900/90">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3.5 text-center border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'report'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>1. Report Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relocate')}
            className={`flex-1 py-3.5 text-center border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'relocate'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
            <span>2. Relocate Machine</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {activeTab === 'report' ? (
            <form onSubmit={handleBreakdownSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Specific Sewing Fault *
                </label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-100 outline-none"
                >
                  <option value="Skipping Stitches / Looper Timing Misalignment">
                    Skipping Stitches / Looper Timing Misalignment
                  </option>
                  <option value="Frequent Needle Breakage">
                    Frequent Needle Breakage (Deflection / Feed clash)
                  </option>
                  <option value="Thread Tension / Puckering">
                    Thread Tension / Seam Puckering (Birdnesting)
                  </option>
                  <option value="Motor Error / E-07 Controller">
                    Motor Error / Direct-Drive Controller E-07
                  </option>
                  <option value="Oil Reservoir Leakage">
                    Oil Reservoir Leakage / Siphon Failure
                  </option>
                  <option value="Bobbin Winder / Cutter Jam">
                    Under-bed Thread Trimmer (UTT) / Cutter Jam
                  </option>
                  <option value="Severe Noise & Vibration">
                    Severe Noise & Bearing Vibration
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Severity / Line Impact *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      urgency === 'CRITICAL'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'CRITICAL'}
                      onChange={() => setUrgency('CRITICAL')}
                      className="mr-2 text-rose-500"
                    />
                    <span>Critical (Line Stopped)</span>
                  </label>
                  <label
                    className={`flex items-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      urgency === 'WARNING'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'WARNING'}
                      onChange={() => setUrgency('WARNING')}
                      className="mr-2 text-amber-500"
                    />
                    <span>Warning (Quality Defect)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Floor Notes for Attending Mechanic
                </label>
                <textarea
                  value={faultNotes}
                  onChange={(e) => setFaultNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Breaking needle on heavy seam crossover on pocket attachment..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Radio className="w-4 h-4" />
                <span>Broadcast Breakdown to Mechanic Queue</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRelocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Move To Target Line / Area *
                </label>
                <select
                  value={targetLine}
                  onChange={(e) => setTargetLine(e.target.value as FloorLine)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-100 outline-none"
                >
                  <option value="Line 01">Line 01 (Polo / Knit)</option>
                  <option value="Line 02">Line 02 (T-Shirts Basic)</option>
                  <option value="Line 03">Line 03 (Woven Shirts)</option>
                  <option value="Line 04">Line 04 (Denim Bottoms)</option>
                  <option value="Buffer Workshop">Buffer Workshop (Standby Pool)</option>
                  <option value="Scrap Bay">Scrap Bay (Decommissioned)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Station Position
                </label>
                <input
                  type="text"
                  value={targetStation}
                  onChange={(e) => setTargetStation(e.target.value)}
                  placeholder="e.g. Station 06"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-100 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Relocation
                </label>
                <input
                  type="text"
                  value={relocateReason}
                  onChange={(e) => setRelocateReason(e.target.value)}
                  placeholder="e.g. Style changeover: line balancing for heavy seam"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Confirm Machine Movement</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
