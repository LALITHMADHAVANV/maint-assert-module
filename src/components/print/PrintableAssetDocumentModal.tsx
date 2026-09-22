'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Tag,
  FileText,
  Grid,
  CheckCircle2,
  MapPin,
  ArrowRightLeft,
  Wrench,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Machine } from '@/types/cmms';
import { formatRupee } from '@/lib/formatters';

interface PrintableAssetDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Machine;
  allAssets?: Machine[];
  initialMode?: 'TAG' | 'DOCUMENT' | 'BATCH';
}

const TYPE_NAME_MAP: Record<string, string> = {
  OVERLOCK_4_THREAD: '4 Thread Overlock',
  OVERLOCK_RIB_THREAD: 'Rib Thread Overlock',
  OVERLOCK_LFC: 'LFC Overlock',
  FLATLOCK_HEMMING: 'Hemming Flatlock',
  FLATLOCK_SMALL_CYLINDER: 'Small Cylinder Bed Flatlock',
  FLATLOCK_CYLINDER_BED: 'Cylinder Bed Flatlock',
  FLATLOCK_FLAT_BED: 'Flat Bed Flatlock',
  FLATLOCK_VT: 'VT Flatlock',
  FLATLOCK_TOP_ELASTIC: 'Top Elastic Flatlock',
  SN_BROTHER_KAJA: 'Brother KAJA (Buttonhole)',
  SN_BROTHER_BUTTON_STITCH: 'Brother Button Stitch',
  SN_BROTHER_BARTACK: 'Brother Bartack',
  SNLS: 'Single Needle Lockstitch (SNLS)',
  DNLS: 'Double Needle Lockstitch (DNLS)',
  OVERLOCK: '4-Thread Overlock / Safety Stitch',
  FLATLOCK: 'Flatlock / Interlock (Coverstitch)',
  BUTTONHOLE: 'Buttonhole Indexer',
  BARTACK: 'Electronic Bartack Machine',
  FEED_OFF_ARM: 'Feed-off-the-arm (FOTA)',
  CUTTING_MACHINE: 'Straight Knife Cutter',
  FUSING_PRESS: 'Collar / Cuff Fusing Press',
  TABLE_CUTTING: 'Fabric Spreading & Cutting Table',
  TABLE_SEWING: 'Sewing Workstation Table',
  TABLE_INSPECTION: 'QC Garment Checking Table',
  TABLE_PACKING: 'Final Folding Table',
  TABLE_PATTERN: 'Pattern Drafting Table',
  CHAIR_OPERATOR: 'Ergonomic Sewing Chair',
  CHAIR_SUPERVISOR: 'High-Back Supervisor Chair',
  CHAIR_STOOL: 'Mechanic Workshop Stool',
  LIGHT_HIGHBAY: 'Overhead Linear High-Bay LED',
  LIGHT_TASK: 'Needle Station Gooseneck Lamp',
  LIGHT_INSPECTION: 'Color-Checking Inspection Tube',
  FAN_CEILING: 'Heavy Industrial Ceiling Fan',
  FAN_EXHAUST: 'Wall Exhaust Blower',
  FAN_PEDESTAL: 'High-Velocity Floor Pedestal Fan',
  UTILITY_BOILER: 'Industrial Steam Generator',
  UTILITY_COMPRESSOR: 'Screw Air Compressor',
  UTILITY_SAFETY: 'Line Fire Safety Station',
};

export function PrintableAssetDocumentModal({
  isOpen,
  onClose,
  asset,
  allAssets = [],
  initialMode = 'TAG',
}: PrintableAssetDocumentModalProps) {
  const [printMode, setPrintMode] = useState<'TAG' | 'DOCUMENT' | 'BATCH'>(initialMode);
  const [origin, setOrigin] = useState('https://textech.factory');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setPrintMode(initialMode);
  }, [initialMode]);

  if (!isOpen || !asset) return null;

  const qrUrl = `${origin}/scan/${encodeURIComponent(asset.id)}`;
  const displayClass = asset.typeName || TYPE_NAME_MAP[asset.type] || asset.type;
  const valuation = asset.cost ? formatRupee(asset.cost) : '₹75,000';
  const regDate = asset.purchaseDate || '2023-01-01';

  // Batch machines for sheet printing
  const batchList = allAssets.length > 0 ? allAssets.slice(0, 8) : [asset];

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:static print:p-0 print:bg-white print-modal-overlay">
      <div className="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden my-auto print:max-w-none print:w-full print:border-none print:shadow-none print:bg-white print:rounded-none print:overflow-visible print-modal-container">
        
        {/* Modal Top Bar (Hidden during actual print) */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">Document Print &amp; Layout Preview</h3>
                <span className="font-mono text-xs text-indigo-300 font-bold bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/50">
                  {asset.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect document formatting and trigger high-resolution printer output.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document Now</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close Print Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Format Tabs (Hidden during print) */}
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0 no-print">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider mr-1">Format:</span>
            <button
              type="button"
              onClick={() => setPrintMode('TAG')}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'TAG'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Thermal QR Tag (Sticker)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('DOCUMENT')}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'DOCUMENT'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Equipment Passport (A4 Document)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('BATCH')}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'BATCH'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Batch Sticker Sheet ({batchList.length} Units)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Ready for standard A4 / 4&times;3&quot; label printers
          </div>
        </div>

        {/* Scrollable Document Canvas (The exact document that is printed) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center items-start print:p-0 print:overflow-visible">
          
          {/* ============================================================== */}
          {/* FORMAT 1: THERMAL QR ASSET TAG LABEL (PHYSICAL STICKER)        */}
          {/* ============================================================== */}
          {printMode === 'TAG' && (
            <div
              id="printable-qr-tag"
              className="bg-white border-2 border-slate-950 rounded-2xl p-5 shadow-lg w-full max-w-[420px] print:shadow-none print:border-2 print:border-black print:rounded-none print:m-0 print:max-w-[400px]"
            >
              {/* Sticker Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2 mb-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-900 inline" />
                    <span>TexTech Apparel Group</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-950 tracking-tight">
                    FACTORY ASSET TAG
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 text-[9px] font-black bg-slate-950 text-white rounded uppercase tracking-wider">
                    {asset.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* QR and Specification Body */}
              <div className="flex items-center gap-4">
                {/* Sharp QR Code */}
                <div className="w-32 h-32 flex-shrink-0 bg-white p-2 border-2 border-slate-950 rounded-xl flex items-center justify-center">
                  <QRCodeSVG
                    value={qrUrl}
                    size={110}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                <div className="space-y-1 text-left flex-grow min-w-0">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Asset ID</div>
                  <div className="text-base font-black text-slate-950 font-mono tracking-tight truncate">
                    {asset.id}
                  </div>

                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Make / Model</div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {asset.brand.toUpperCase()} &bull; {asset.model}
                  </div>

                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Class</div>
                  <div className="text-xs text-slate-800 truncate font-semibold">
                    {displayClass}
                  </div>

                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Current Station</div>
                  <div className="text-xs font-bold text-slate-950 truncate">
                    {asset.currentLine} &bull; {asset.stationNo}
                  </div>
                </div>
              </div>

              {/* Location Tracking Strip on Sticker */}
              {asset.previousLine && (
                <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700 bg-slate-50 px-2 py-1 rounded">
                  <span className="font-semibold text-slate-500">Held Before:</span>
                  <span className="font-bold text-slate-900">
                    {asset.previousLine} {asset.previousStation ? `(${asset.previousStation})` : ''}
                  </span>
                </div>
              )}

              {/* Valuation & Motor Metadata */}
              <div className="mt-2.5 pt-2 border-t border-dashed border-slate-400 flex items-center justify-between text-[9px] font-mono text-slate-700">
                <span>Motor: {asset.motorType || 'SERVO'}</span>
                <span>Valuation: {valuation}</span>
                <span>Reg: {regDate}</span>
              </div>

              {/* Footer Instruction */}
              <div className="mt-2 text-center text-[8px] uppercase tracking-wider font-bold text-slate-500">
                Scan with phone or shop terminal for breakdown &amp; relocation
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FORMAT 2: OFFICIAL EQUIPMENT MASTER PASSPORT (FULL A4 SHEET)    */}
          {/* ============================================================== */}
          {printMode === 'DOCUMENT' && (
            <div className="printable-document bg-white border border-slate-300 shadow-xl p-8 sm:p-10 w-full max-w-[800px] text-slate-900 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
              
              {/* Document Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-700">
                      TexTech Apparel Group &bull; Unit 03 Coimbatore
                    </div>
                    <h1 className="text-xl font-black text-slate-950 tracking-tight mt-0.5 uppercase">
                      Equipment Master Specification &amp; Asset Passport
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Plant Maintenance &amp; Machinery Engineering Division &bull; Compliance Record
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono font-bold text-slate-950">DOC-ID: DOC-EQ-{asset.id}</div>
                    <div className="text-slate-500 text-[10px]">
                      Printed: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 text-[9px] font-black bg-slate-950 text-white rounded uppercase">
                      Status: {asset.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Identity Strip: QR Code & Machine Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
                <div className="sm:col-span-3 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                  <div className="p-2 bg-white border-2 border-slate-900 rounded-xl">
                    <QRCodeSVG
                      value={qrUrl}
                      size={105}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">/scan/{asset.id}</span>
                </div>

                <div className="sm:col-span-9 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Asset Register ID</div>
                      <div className="font-mono font-black text-slate-950 text-base">{asset.id}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Asset Capital Valuation</div>
                      <div className="font-mono font-black text-slate-950 text-base">{valuation}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Make &amp; Brand</div>
                      <div className="font-bold text-slate-900">{asset.brand}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Model / Series</div>
                      <div className="font-bold text-slate-900">{asset.model}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Machinery Class</div>
                      <div className="font-semibold text-slate-800">{displayClass}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Operator</div>
                      <div className="font-semibold text-slate-800">{asset.operator || 'Unassigned / Floor Pool'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Tracking & Movement History Card */}
              <div className="space-y-2 print-break-inside-avoid">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Factory Location Tracking &amp; Movement Ledger</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 print:bg-white">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Where Held Before (Previous Origin)</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm mt-1">
                      {asset.previousLine || 'Original Factory Placement'}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {asset.previousStation || 'Initial Line Configuration'}
                    </div>
                  </div>

                  <div className="p-3 border-2 border-slate-900 rounded-xl bg-white">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>Where Moved To (Current Active Station)</span>
                    </div>
                    <div className="font-black text-slate-950 text-sm mt-1">
                      {asset.currentLine}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                      {asset.stationNo} &bull; {asset.department || 'Sewing Floor'}
                    </div>
                  </div>
                </div>

                {asset.lastMovedReason && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center text-slate-700 print:bg-white">
                    <div>
                      <span className="font-bold text-slate-900">Transfer Reason: </span>
                      <span className="italic">&ldquo;{asset.lastMovedReason}&rdquo;</span>
                    </div>
                    {asset.lastMovedBy && (
                      <span className="text-[10px] text-slate-500">
                        Authorized By: <strong>{asset.lastMovedBy}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Technical Specifications Table */}
              <div className="space-y-2 print-break-inside-avoid">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Engineering &amp; Electrical Specifications</span>
                </h3>

                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 pr-4 font-bold text-slate-500 w-1/3">Motor Type / Drive</td>
                      <td className="py-2 font-mono font-semibold text-slate-900">
                        {asset.motorType || 'SERVO Direct Drive'} (Energy Efficient)
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 pr-4 font-bold text-slate-500">Purchase / Commission Date</td>
                      <td className="py-2 font-mono text-slate-900">{regDate}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 pr-4 font-bold text-slate-500">Machinery Age</td>
                      <td className="py-2 font-mono text-slate-900">
                        {asset.ageYears ? `${asset.ageYears} Years Operational` : 'New Machine'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 pr-4 font-bold text-slate-500">Cumulative Downtime</td>
                      <td className="py-2 font-mono text-slate-900">{asset.totalDowntimeMinutes || 0} Minutes Recorded</td>
                    </tr>
                    {asset.specs && (
                      <tr className="border-b border-slate-200">
                        <td className="py-2 pr-4 font-bold text-slate-500">Special Attachments</td>
                        <td className="py-2 text-slate-900">{asset.specs}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Standard Maintenance & SOP Checklist */}
              <div className="grid grid-cols-2 gap-4 text-xs print-break-inside-avoid">
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5 print:bg-white">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Preventive Maintenance Checklist</span>
                  </div>
                  <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                    <li>Daily needle bar clearance &amp; timing check</li>
                    <li>Verify automatic oil lubrication level</li>
                    <li>Clean lint from rotary hook &amp; feed dog</li>
                    <li>Inspect servo drive belt tension</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5 print:bg-white">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Standard Operating Procedures</span>
                  </div>
                  <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                    <li>Always engage finger &amp; eye guard before run</li>
                    <li>Scan QR tag to report mechanical fault</li>
                    <li>Power off master isolator during rethreading</li>
                    <li>Only certified mechanics authorized for overhauls</li>
                  </ul>
                </div>
              </div>

              {/* Official Sign-Off Section */}
              <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-xs print-break-inside-avoid">
                <div>
                  <div className="font-bold text-slate-900">Plant Maintenance Lead:</div>
                  <div className="border-b border-slate-400 mt-8" />
                  <div className="text-[10px] text-slate-500 mt-1">Signature &amp; Stamp</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">Floor Line Supervisor:</div>
                  <div className="border-b border-slate-400 mt-8" />
                  <div className="text-[10px] text-slate-500 mt-1">Signature &amp; Date</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">QA / Safety Inspector:</div>
                  <div className="border-b border-slate-400 mt-8" />
                  <div className="text-[10px] text-slate-500 mt-1">Verified &amp; Certified</div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* FORMAT 3: BATCH QR STICKER SHEET (MULTI-UP LABELS)             */}
          {/* ============================================================== */}
          {printMode === 'BATCH' && (
            <div className="printable-document w-full max-w-[800px] bg-white p-6 shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 space-y-4">
              <div className="border-b border-slate-300 pb-2 mb-4 flex justify-between items-center no-print">
                <div className="text-xs font-bold text-slate-800">
                  Batch Thermal Tag Sheet ({batchList.length} Labels)
                </div>
                <div className="text-xs text-slate-500">
                  Ready for Avery 2&times;4 / Sticker Paper Sheet
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {batchList.map((m) => {
                  const mQr = `${origin}/scan/${encodeURIComponent(m.id)}`;
                  const mTypeStr = m.typeName || TYPE_NAME_MAP[m.type] || m.type;
                  const mVal = m.cost ? formatRupee(m.cost) : '₹75,000';

                  return (
                    <div
                      key={m.id}
                      className="border-2 border-slate-900 rounded-xl p-3.5 bg-white space-y-2 print-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between border-b border-slate-400 pb-1.5 text-[9px] font-black uppercase">
                        <span>TexTech Asset Tag</span>
                        <span className="bg-slate-900 text-white px-1.5 py-0.2 rounded font-mono">
                          {m.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 flex-shrink-0 bg-white p-1 border border-slate-400 rounded flex items-center justify-center">
                          <QRCodeSVG
                            value={mQr}
                            size={72}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#000000"
                          />
                        </div>

                        <div className="space-y-0.5 text-left flex-grow min-w-0 text-[11px]">
                          <div className="font-mono font-black text-slate-950 text-xs truncate">
                            {m.id}
                          </div>
                          <div className="font-bold text-slate-800 truncate text-[10px]">
                            {m.brand} &bull; {m.model}
                          </div>
                          <div className="text-slate-600 truncate text-[10px]">
                            {mTypeStr}
                          </div>
                          <div className="font-semibold text-slate-950 truncate text-[10px]">
                            {m.currentLine} &bull; {m.stationNo}
                          </div>
                          {m.previousLine && (
                            <div className="text-[9px] text-slate-500 truncate">
                              Prev: {m.previousLine}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-dashed border-slate-300 flex justify-between text-[8px] font-mono text-slate-500">
                        <span>{m.motorType || 'SERVO'}</span>
                        <span>{mVal}</span>
                        <span>/scan/{m.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls (Hidden during print) */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between no-print shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Document layout formatted for direct high-contrast printing</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
