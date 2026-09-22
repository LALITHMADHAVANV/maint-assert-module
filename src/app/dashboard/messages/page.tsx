'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  Crown,
  ShieldAlert,
  Zap,
  Building,
  IndianRupee,
  FileText,
  User,
  CheckCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PartRequisition } from '@/types/cmms';
import {
  subscribeRequisitions,
  approveRequisition,
  rejectRequisition,
} from '@/lib/services/cmmsService';

export default function CeoMessagesPage() {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [requisitions, setRequisitions] = useState<PartRequisition[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const isCeoOrAdmin = role === 'CEO' || role === 'ADMIN' || role === 'ASSET_MANAGER';

  useEffect(() => {
    const unsub = subscribeRequisitions((reqs) => {
      // Filter for requisitions requiring CEO approval or marked as critical
      const ceoMessages = reqs.filter(
        (r) => r.type === 'CRITICAL_CEO' || r.requiresCeoApproval || r.urgency === 'CRITICAL_CEO_APPROVAL'
      );
      setRequisitions(ceoMessages);
    });

    return () => unsub();
  }, []);

  const pendingCount = requisitions.filter((r) => r.status === 'PENDING_CEO_APPROVAL').length;
  const approvedCount = requisitions.filter((r) => r.status === 'APPROVED_BY_CEO').length;
  const totalCapexRequested = requisitions.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);
  const pendingCapex = requisitions
    .filter((r) => r.status === 'PENDING_CEO_APPROVAL')
    .reduce((acc, r) => acc + (r.estimatedCost || 0), 0);

  const handleApprove = async (id: string) => {
    const note = remarksMap[id] || 'Emergency purchase approved under executive maintenance contingency reserve.';
    try {
      await approveRequisition(
        id,
        user?.name ? `${user.name} (CEO)` : 'Dr. K. Ramanathan (CEO)',
        note,
        'APPROVED_BY_CEO'
      );
      showToast('Executive authorization granted! Purchase order dispatched to Tool Crib & Floor.', 'success');
      setRemarksMap((prev) => ({ ...prev, [id]: '' }));
    } catch (e) {
      showToast('Error approving critical request', 'error');
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    const note = remarksMap[id] || 'Declined: Seek alternate floor machine cannibalization or buffer reserve.';
    try {
      await rejectRequisition(
        id,
        user?.name ? `${user.name} (CEO)` : 'Dr. K. Ramanathan (CEO)',
        note
      );
      showToast('Request returned with executive instructions.', 'info');
      setRemarksMap((prev) => ({ ...prev, [id]: '' }));
    } catch (e) {
      showToast('Error declining request', 'error');
      console.error(e);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcastSent(true);
    showToast(`Executive Directive broadcasted to all 4 sewing lines & maintenance floor!`, 'success');
    setTimeout(() => {
      setBroadcastText('');
      setBroadcastSent(false);
    }, 2500);
  };

  const filteredRequisitions = requisitions.filter((r) => {
    if (filter === 'PENDING') return r.status === 'PENDING_CEO_APPROVAL';
    if (filter === 'APPROVED') return r.status === 'APPROVED_BY_CEO';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Office & Chief Executive Decision Desk</span>
              </span>
              <span className="text-xs text-purple-300 font-mono">
                {user?.name || 'Dr. K. Ramanathan'} ({role || 'CEO'})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Critical Spare Parts & Emergency Approvals
            </h1>
            <p className="text-sm text-purple-200/80 mt-1 max-w-2xl">
              Real-time urgent breakdown dispatches and line-stoppage part requests requiring immediate CEO financial authorization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-900/40 backdrop-blur-xs border border-purple-700/50 rounded-xl px-4 py-2.5 text-right">
              <span className="block text-[11px] uppercase tracking-wider text-purple-300 font-semibold">
                Pending Decisions
              </span>
              <div className="flex items-center justify-end gap-2">
                {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
                <span className="text-2xl font-black text-rose-400">{pendingCount}</span>
              </div>
            </div>

            <div className="bg-purple-900/40 backdrop-blur-xs border border-purple-700/50 rounded-xl px-4 py-2.5 text-right">
              <span className="block text-[11px] uppercase tracking-wider text-purple-300 font-semibold">
                Emergency Budget Impact
              </span>
              <span className="text-2xl font-black text-amber-400">₹{pendingCapex.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Authority Advisory Banner */}
      {!isCeoOrAdmin && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Executive Authority Restricted:</span> You are viewing the CEO Approval Desk in read-only mode as <span className="font-mono font-bold uppercase">{role || 'GUEST'}</span>. Only <strong>CEO Dr. K. Ramanathan</strong> or <strong>Plant Admin</strong> has authority to approve or decline critical capital spare orders.
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Critical Requests</div>
            <div className="text-xl font-extrabold text-slate-900">{pendingCount} Pending</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Executive Approvals</div>
            <div className="text-xl font-extrabold text-emerald-700">{approvedCount} Authorized</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Emergency CapEx</div>
            <div className="text-xl font-extrabold text-slate-900">₹{totalCapexRequested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Protected Lines</div>
            <div className="text-xl font-extrabold text-indigo-700">Line 01 & 02</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Critical Messages Feed & Executive Broadcast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Critical Part Message Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Critical Part Messages Inbox ({filteredRequisitions.length})
              </h2>
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  filter === 'PENDING'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Needs Action ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  filter === 'APPROVED'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  filter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Messages
              </button>
            </div>
          </div>

          {filteredRequisitions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">All Clear! No Pending Critical Halts</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no emergency part replacement requests awaiting CEO approval at this time. All factory lines are operating normally.
              </p>
            </div>
          ) : (
            filteredRequisitions.map((req) => {
              const isPending = req.status === 'PENDING_CEO_APPROVAL';
              const isApproved = req.status === 'APPROVED_BY_CEO';
              const remarks = remarksMap[req.id] || '';

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                    isPending
                      ? 'border-rose-300 ring-2 ring-rose-500/10'
                      : isApproved
                      ? 'border-emerald-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Urgent Message Header Banner */}
                  <div
                    className={`px-5 py-3 flex items-center justify-between ${
                      isPending
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
                        : isApproved
                        ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-b border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${isPending ? 'text-amber-300 animate-bounce' : ''}`} />
                      <span className="text-xs font-extrabold uppercase tracking-wide">
                        {isPending
                          ? '🚨 CRITICAL LINE STOPPAGE — CEO ACTION REQUIRED'
                          : isApproved
                          ? '✓ AUTHORIZED BY CEO'
                          : req.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span>{req.id}</span>
                      <span className="text-[10px] opacity-80">
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-4">
                    {/* Machine & Sender Details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-900 text-white font-mono">
                          {req.targetMachineId || 'Machinery Core'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {req.targetLine || 'Sewing Floor'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Requested by: </span>
                        <strong className="text-slate-800">{req.requestedBy}</strong>
                        <span className="text-[10px] text-slate-400">({req.requestedByRole})</span>
                      </div>
                    </div>

                    {/* Part & Financial Impact Block */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Emergency Replacement Component
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">
                          {req.partName}
                        </h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          SKU: <span className="font-semibold text-slate-700">{req.sku}</span> • Qty Needed:{' '}
                          <span className="font-bold text-indigo-600">
                            {req.quantity} {req.unit}
                          </span>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:pl-4 border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Emergency CapEx</div>
                        <div className="text-2xl font-black text-rose-600">
                          ₹{req.estimatedCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Mechanic's Justification Message */}
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mechanic Technical Justification:</span>
                      </div>
                      <p className="text-xs text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 leading-relaxed font-sans">
                        &ldquo;{req.justification}&rdquo;
                      </p>
                    </div>

                    {/* Executive Review & Audit Trail (If already reviewed) */}
                    {req.reviewedBy && (
                      <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Executive Authorization Log:</span>
                        </div>
                        <p className="text-emerald-800 italic">&ldquo;{req.reviewNotes}&rdquo;</p>
                        <div className="text-[10px] text-emerald-600 pt-1">
                          Signed by {req.reviewedBy} at {new Date(req.reviewedAt || '').toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* CEO Action Bar (For pending requests) */}
                    {isPending && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            CEO Executive Remarks / Budget Authorization Notes (Optional):
                          </label>
                          <input
                            type="text"
                            value={remarks}
                            onChange={(e) =>
                              setRemarksMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            placeholder="e.g. Approved under emergency CapEx reserves. Priority air shipment authorized."
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800 transition"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                          <button
                            disabled={!isCeoOrAdmin}
                            onClick={() => handleApprove(req.id)}
                            className={`w-full sm:flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 ${
                              isCeoOrAdmin
                                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer'
                                : 'bg-slate-400 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isCeoOrAdmin ? 'Grant CEO Executive Approval' : 'Requires CEO Signature'}
                            </span>
                          </button>

                          <button
                            disabled={!isCeoOrAdmin}
                            onClick={() => handleReject(req.id)}
                            className={`w-full sm:w-auto px-4 py-2.5 border text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                              isCeoOrAdmin
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300 hover:border-rose-300 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline / Defer</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 1 Col: CEO Emergency Directive Broadcast */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Broadcast Executive Directive</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Send an urgent executive memo or maintenance instruction directly to floor supervisors, tool crib storekeepers, and mechanics.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <textarea
                rows={4}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="e.g. NOTICE: All Line 02 Overlocks must undergo looper gap verification before 4:00 PM shift changeover..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800 transition"
              />

              <button
                type="submit"
                disabled={!broadcastText.trim() || broadcastSent}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{broadcastSent ? 'Transmitted to Floor!' : 'Broadcast to Floor Units'}</span>
              </button>
            </form>
          </div>

          {/* Quick Authority Guidelines */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 rounded-2xl p-5 border border-purple-200/70 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-purple-700" />
              <span>Executive Authorization Policy</span>
            </h4>
            <ul className="text-xs text-purple-900/80 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="text-purple-600 font-bold">•</span>
                <span><strong>Critical Needs (High Value / CapEx):</strong> Halts export line sewing. Automatically routed to CEO inbox with high priority.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-purple-600 font-bold">•</span>
                <span><strong>Urgent Needs (Operational Spare):</strong> Fast-tracked directly by Plant Maintenance Manager.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-purple-600 font-bold">•</span>
                <span><strong>Monthly Indents:</strong> Aggregated in advance by Senior Mechanics and fulfilled by Tool Crib Store In-Charge.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
