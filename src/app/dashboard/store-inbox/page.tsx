'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Truck,
  ArrowRight,
  ClipboardList,
  Boxes,
  User,
  Calendar,
  AlertCircle,
  FileText,
  BadgeCheck,
  Search,
  Plus,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PartRequisition, SparePart } from '@/types/cmms';
import {
  subscribeRequisitions,
  subscribeParts,
  fulfillMonthlyIndent,
} from '@/lib/services/cmmsService';

export default function StoreInboxPage() {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [requisitions, setRequisitions] = useState<PartRequisition[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [filter, setFilter] = useState<'PENDING_RECEIPT' | 'FULFILLED' | 'ALL'>('PENDING_RECEIPT');
  const [activeModalReq, setActiveModalReq] = useState<PartRequisition | null>(null);
  const [modalAction, setModalAction] = useState<'RECEIVE' | 'DISPATCH'>('RECEIVE');
  const [notes, setNotes] = useState('');
  const [challanNo, setChallanNo] = useState('');

  const isStorePersonOrAdmin = role === 'STORE_PERSON' || role === 'ADMIN' || role === 'ASSET_MANAGER';

  useEffect(() => {
    const unsubReqs = subscribeRequisitions((reqs) => {
      // Filter strictly for monthly indents assigned to the store person
      const storeMonthlyIndents = reqs.filter((r) => r.type === 'MONTHLY_INDENT');
      setRequisitions(storeMonthlyIndents);
    });

    const unsubParts = subscribeParts((allParts) => {
      setParts(allParts);
    });

    return () => {
      unsubReqs();
      unsubParts();
    };
  }, []);

  const pendingIndents = requisitions.filter(
    (r) => r.status !== 'FULFILLED' && r.status !== 'REJECTED'
  );
  const fulfilledIndents = requisitions.filter((r) => r.status === 'FULFILLED');

  const openActionModal = (req: PartRequisition, action: 'RECEIVE' | 'DISPATCH') => {
    setActiveModalReq(req);
    setModalAction(action);
    setChallanNo(action === 'RECEIVE' ? `DC-${Math.floor(100000 + Math.random() * 900000)}` : '');
    setNotes(
      action === 'RECEIVE'
        ? 'Verified physical box seal & QC pass certificate. Batch loaded into tool crib bins.'
        : `Handed over quota to line floor runner. Received signature for ${req.targetLine || 'Line 01'}.`
    );
  };

  const handleExecuteAction = async () => {
    if (!activeModalReq) return;
    try {
      const fullNote = challanNo ? `[Challan #${challanNo}] ${notes}` : notes;
      await fulfillMonthlyIndent(
        activeModalReq.id,
        user?.name ? `${user.name} (Store In-Charge)` : 'M. Arumugam (Stores In-Charge)',
        fullNote,
        modalAction === 'RECEIVE' ? 'RECEIVE_INTO_CRIB' : 'DISPATCH_TO_LINE'
      );

      showToast(
        modalAction === 'RECEIVE'
          ? `Inward monthly shipment received & stock credited to tool crib!`
          : `Monthly supply quota dispatched to ${activeModalReq.targetLine || 'Floor Lines'}!`,
        'success'
      );
      setActiveModalReq(null);
    } catch (e) {
      showToast('Error processing store action', 'error');
      console.error(e);
    }
  };

  const filteredList = requisitions.filter((r) => {
    if (filter === 'PENDING_RECEIPT') return r.status !== 'FULFILLED';
    if (filter === 'FULFILLED') return r.status === 'FULFILLED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Store Terminal Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tool Crib & Store Receiving Custody</span>
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                Assigned to: {user?.name || 'M. Arumugam'} (Tool Crib Storekeeper)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Monthly Indent Products & Intake Receiving
            </h1>
            <p className="text-sm text-emerald-200/80 mt-1 max-w-2xl">
              Exclusively manage spare parts requested by mechanics for monthly factory operations. Receive bulk supplier deliveries into bins and dispatch quotas to sewing lines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-900/40 backdrop-blur-xs border border-emerald-700/50 rounded-xl px-4 py-2.5 text-right">
              <span className="block text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                Pending Receiving
              </span>
              <span className="text-2xl font-black text-amber-400">{pendingIndents.length} Indents</span>
            </div>

            <div className="bg-emerald-900/40 backdrop-blur-xs border border-emerald-700/50 rounded-xl px-4 py-2.5 text-right">
              <span className="block text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                Completed Deliveries
              </span>
              <span className="text-2xl font-black text-emerald-400">{fulfilledIndents.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Authority Advisory Banner */}
      {!isStorePersonOrAdmin && (
        <div className="bg-blue-50 border border-blue-300 p-4 rounded-2xl flex items-center justify-between text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-200 text-blue-800 flex items-center justify-center font-bold shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Store Person Custody Only:</span> You are viewing the Monthly Store Indents in read-only mode as <span className="font-mono font-bold uppercase">{role || 'GUEST'}</span>. Only <strong>Store Person M. Arumugam</strong> or <strong>Plant Admin</strong> has authority to receive inward stock and dispatch parts to sewing lines.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Store Inbox Orders & Crib Current Stock Shelf */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Products Assigned to Storekeeper */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Monthly Supply Indents Under Your Name ({filteredList.length})
              </h2>
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFilter('PENDING_RECEIPT')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  filter === 'PENDING_RECEIPT'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                To Receive & Dispatch ({pendingIndents.length})
              </button>
              <button
                onClick={() => setFilter('FULFILLED')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  filter === 'FULFILLED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fulfilled ({fulfilledIndents.length})
              </button>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  filter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Monthly Indents Pending</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All monthly spare parts assigned to your tool crib have been received and dispatched to the sewing lines.
              </p>
            </div>
          ) : (
            filteredList.map((req) => {
              const isFulfilled = req.status === 'FULFILLED';
              const isOrdered = req.status === 'ORDERED';

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                    isFulfilled
                      ? 'border-emerald-200'
                      : isOrdered
                      ? 'border-indigo-200'
                      : 'border-amber-300 ring-2 ring-amber-500/10'
                  }`}
                >
                  {/* Indent Header Strip */}
                  <div
                    className={`px-5 py-3 flex items-center justify-between ${
                      isFulfilled
                        ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-100'
                        : isOrdered
                        ? 'bg-indigo-50 text-indigo-900 border-b border-indigo-100'
                        : 'bg-amber-50 text-amber-900 border-b border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">
                        {req.monthYear} • Monthly Parts Indent
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isFulfilled
                            ? 'bg-emerald-200 text-emerald-800'
                            : isOrdered
                            ? 'bg-indigo-200 text-indigo-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {isFulfilled ? 'Stock Dispatched to Lines' : isOrdered ? 'In Tool Crib' : 'Awaiting Store Intake'}
                      </span>
                      <span className="text-xs font-mono font-bold">{req.id}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Meta details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Target Production Lines:</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          {req.targetLine || 'Line 01 & Line 03'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Requested by Senior Mechanic: </span>
                        <strong className="text-slate-800">{req.requestedBy}</strong>
                      </div>
                    </div>

                    {/* Itemized Parts Needed for the Month Table */}
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Monthly Products Required Under Store Custody ({req.items?.length || 0} Parts):</span>
                        </span>
                        <span className="text-slate-500 font-mono">
                          Allocation Total: <strong className="text-slate-900">₹{req.estimatedCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Part Name & Specs</th>
                              <th className="py-2.5 px-3">SKU</th>
                              <th className="py-2.5 px-3 text-right">Quota Quantity</th>
                              <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                              <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {req.items?.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {item.partName}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                  {item.sku}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-500">
                                  ₹{item.unitCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                  ₹{item.totalCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operational Notes / Remarks */}
                    {req.storeNotes && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Store Receiving Log:</span>
                        </span>
                        <p className="text-slate-600 italic">&ldquo;{req.storeNotes}&rdquo;</p>
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          Handled by {req.assignedStorePerson} on {new Date(req.fulfilledAt || '').toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Store Keeper Actions */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      {isStorePersonOrAdmin ? (
                        <>
                          {!isOrdered && !isFulfilled && (
                            <button
                              onClick={() => openActionModal(req, 'RECEIVE')}
                              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                              <span>Receive Inward Delivery into Crib</span>
                            </button>
                          )}

                          {!isFulfilled && (
                            <button
                              onClick={() => openActionModal(req, 'DISPATCH')}
                              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowRight className="w-4 h-4" />
                              <span>Dispatch Quota to Sewing Lines</span>
                            </button>
                          )}
                        </>
                      ) : !isFulfilled ? (
                        <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>Fulfillment requires Store Person (M. Arumugam)</span>
                        </div>
                      ) : null}

                      {isFulfilled && (
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Delivered & Closed for {req.monthYear}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 1 Col: Quick Tool Crib Stock Bins */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Current Crib Stock Bins</h3>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-600">
                10 Garment Parts
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Live inventory balances in Tool Crib A & B for active sewing lines:
            </p>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {parts.map((p) => {
                const isLow = p.stock <= p.minStock;
                return (
                  <div
                    key={p.partId}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 text-xs transition"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.sku} • Min: {p.minStock} {p.unit}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          isLow ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Person Duty Guidelines */}
          <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-700" />
              <span>Storekeeper Operating Protocol</span>
            </h4>
            <ul className="text-xs text-emerald-900/80 space-y-1.5">
              <li>• Always cross-check supplier delivery challan before receiving into bins.</li>
              <li>• Needles and oil must be stored in humidity-controlled Tool Crib Bin A-04.</li>
              <li>• Mechanics must sign the floor issue chit upon collection for Line 01-04.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Action Modal: Receive or Dispatch */}
      {activeModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    modalAction === 'RECEIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {modalAction === 'RECEIVE' ? <Truck className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalAction === 'RECEIVE'
                      ? 'Inward Delivery Receiving Intake'
                      : 'Dispatch Monthly Products to Floor'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Indent Ref: {activeModalReq.id} ({activeModalReq.monthYear})
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-700 mb-1">Products Being Transferred:</div>
                <ul className="space-y-1 text-slate-600">
                  {activeModalReq.items?.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>• {item.partName}</span>
                      <strong className="text-indigo-700">
                        {item.quantity} {item.unit}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>

              {modalAction === 'RECEIVE' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Supplier Delivery Challan / Invoice #
                  </label>
                  <input
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    placeholder="e.g. DC-984210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Store Notes / Verification Comments
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  modalAction === 'RECEIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {modalAction === 'RECEIVE' ? 'Confirm Inward Stock Intake' : 'Confirm Floor Dispatch'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
