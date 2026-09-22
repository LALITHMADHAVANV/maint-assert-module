'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Wand2,
  Wrench,
  Tag,
  Printer,
  Camera,
  Info,
  Search,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Machine, MachineType, MotorType, FloorLine, MachineStatus } from '@/types/cmms';
import { subscribeMachines, createMachine } from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { ScanModal } from '@/components/scan/ScanModal';

export default function MachinesPage() {
  const { showToast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);

  // Machine form state
  const [mId, setMId] = useState('MC-SNLS-101');
  const [mBrand, setMBrand] = useState('Juki');
  const [mType, setMType] = useState<MachineType>('SNLS');
  const [mModel, setMModel] = useState('DDL-8700-7');
  const [mDate, setMDate] = useState('2023-04-12');
  const [mCost, setMCost] = useState<number>(750);
  const [mMotor, setMMotor] = useState<MotorType>('SERVO');
  const [mLine, setMLine] = useState<FloorLine>('Line 01');
  const [mStation, setMStation] = useState('Station 04');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLine, setFilterLine] = useState<string>('ALL');

  // Scanner modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanModalTargetId, setScanModalTargetId] = useState<string>('');

  // Host origin for QR payload
  const [origin, setOrigin] = useState('https://textech.factory');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeMachines((data) => {
      setMachines(data);
    });
    return () => unsub();
  }, []);

  // Compute machine age dynamically
  const calculatedAge = useMemo(() => {
    if (!mDate) return 'New Machine';
    const pDate = new Date(mDate);
    const now = new Date();
    const diff = (now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diff > 0 ? `${diff.toFixed(1)} Years` : 'New Machine';
  }, [mDate]);

  const typeNameMap: Record<MachineType, string> = {
    SNLS: 'Single Needle Lockstitch (SNLS)',
    DNLS: 'Double Needle Lockstitch (DNLS)',
    OVERLOCK: '4-Thread Overlock / Safety Stitch',
    FLATLOCK: 'Flatlock / Interlock (Coverstitch)',
    BUTTONHOLE: 'Buttonhole Indexer',
    BARTACK: 'Electronic Bartack Machine',
    FEED_OFF_ARM: 'Feed-off-the-arm (FOTA)',
    CUTTING_MACHINE: 'Fabric End / Straight Knife Cutter',
    FUSING_PRESS: 'Collar / Cuff Fusing Press',
    TABLE_CUTTING: 'Fabric Spreading & Cutting Table',
    TABLE_SEWING: 'Sewing Workstation Table',
    TABLE_INSPECTION: 'QC Garment Checking Table',
    TABLE_PACKING: 'Final Folding & Poly-Bagging Table',
    TABLE_PATTERN: 'Pattern Drafting & Master Table',
    CHAIR_OPERATOR: 'Ergonomic Sewing Swivel Chair',
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

  const handleAutofill = () => {
    setMId('MC-OVK-215');
    setMBrand('Jack');
    setMType('OVERLOCK');
    setMModel('C4-4-M03');
    setMDate('2024-01-15');
    setMCost(850);
    setMMotor('SERVO');
    setMLine('Line 02');
    setMStation('Station 11');
    showToast('Sample machine specifications loaded into form.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = mId.trim();
    if (!cleanId) return;

    const newMachine: Machine = {
      id: cleanId,
      brand: mBrand,
      model: mModel.trim() || 'Standard Model',
      type: mType,
      typeName: typeNameMap[mType],
      motorType: mMotor,
      purchaseDate: mDate,
      cost: mCost,
      status: 'ACTIVE',
      currentLine: mLine,
      stationNo: mStation.trim() || 'Station 01',
      totalDowntimeMinutes: 0,
      ageYears: parseFloat(calculatedAge) || 0,
    };

    try {
      await createMachine(newMachine);
      showToast(`Machine ${cleanId} registered & QR asset tag rendered!`, 'success');
    } catch (err) {
      showToast('Failed to register machine', 'error');
      console.error(err);
    }
  };

  const handleSelectForPreview = (m: Machine) => {
    setMId(m.id);
    setMBrand(m.brand);
    setMType(m.type);
    setMModel(m.model);
    setMDate(m.purchaseDate || '2023-01-01');
    setMCost(m.cost || 750);
    setMMotor(m.motorType || 'SERVO');
    setMLine(m.currentLine);
    setMStation(m.stationNo);
    showToast(`Loaded ${m.id} for QR preview and editing`, 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  // Encoded URL for QR code
  const qrUrl = `${origin}/scan/${encodeURIComponent(mId)}`;

  // Filtered machines table
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchesSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.currentLine.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLine = filterLine === 'ALL' || m.currentLine === filterLine;
      return matchesSearch && matchesLine;
    });
  }, [machines, searchQuery, filterLine]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <span>Machine Registry & Instant QR Generation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new industrial sewing machines, calculate age, generate QR asset labels, and preview floor dispatch triggers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutofill}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Autofill Sample</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form (Left) & QR Tag Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left 7 Columns: Machine Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>Machine Specifications</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Machine Asset ID *
                </label>
                <input
                  type="text"
                  required
                  value={mId}
                  onChange={(e) => setMId(e.target.value)}
                  placeholder="e.g. MC-SNLS-109"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Unique factory barcode / stencil</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Brand / Make *
                </label>
                <select
                  required
                  value={mBrand}
                  onChange={(e) => setMBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-medium"
                >
                  <option value="Juki">Juki (Japan)</option>
                  <option value="Brother">Brother (Japan)</option>
                  <option value="Jack">Jack (China)</option>
                  <option value="Pegasus">Pegasus (Japan)</option>
                  <option value="Siruba">Siruba (Taiwan)</option>
                  <option value="Yamato">Yamato (Japan)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Machine Class / Type *
                </label>
                <select
                  required
                  value={mType}
                  onChange={(e) => setMType(e.target.value as MachineType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-medium"
                >
                  <option value="SNLS">Single Needle Lockstitch (SNLS)</option>
                  <option value="DNLS">Double Needle Lockstitch (DNLS)</option>
                  <option value="OVERLOCK">4-Thread Overlock / Safety Stitch</option>
                  <option value="FLATLOCK">Flatlock / Interlock (Coverstitch)</option>
                  <option value="BARTACK">Electronic Bartack Machine</option>
                  <option value="BUTTONHOLE">Buttonhole Indexer</option>
                  <option value="FEED_OFF_ARM">Feed-off-the-arm (FOTA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Model Number *
                </label>
                <input
                  type="text"
                  required
                  value={mModel}
                  onChange={(e) => setMModel(e.target.value)}
                  placeholder="e.g. DDL-8700-7"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  required
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Calculated Age
                </label>
                <input
                  type="text"
                  readOnly
                  value={calculatedAge}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Purchase Cost (USD)
                </label>
                <input
                  type="number"
                  value={mCost}
                  onChange={(e) => setMCost(parseFloat(e.target.value) || 0)}
                  placeholder="750"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Motor Drive Type
                </label>
                <select
                  value={mMotor}
                  onChange={(e) => setMMotor(e.target.value as MotorType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800"
                >
                  <option value="SERVO">Direct-Drive Servo (Energy Saving)</option>
                  <option value="CLUTCH">Traditional Clutch Motor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assigned Floor Line
                </label>
                <select
                  value={mLine}
                  onChange={(e) => setMLine(e.target.value as FloorLine)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-semibold"
                >
                  <option value="Line 01">Line 01 (Polo / Knit)</option>
                  <option value="Line 02">Line 02 (T-Shirts Basic)</option>
                  <option value="Line 03">Line 03 (Woven Shirts)</option>
                  <option value="Line 04">Line 04 (Denim Bottoms)</option>
                  <option value="Buffer Workshop">Buffer Workshop (Standby)</option>
                  <option value="Scrap Bay">Scrap Bay (Decommissioned)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Line Station No.
                </label>
                <input
                  type="text"
                  value={mStation}
                  onChange={(e) => setMStation(e.target.value)}
                  placeholder="Station 08"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Tag className="w-4 h-4" />
                <span>Register Machine & Render Tag</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 Columns: Printable QR Asset Tag Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Asset QR Tag Preview</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded uppercase">
                Standard Thermal Tag
              </span>
            </div>

            {/* Printable Sticker Container */}
            <div
              id="printable-qr-tag"
              className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    TexTech Apparel Group
                  </div>
                  <div className="text-sm font-bold text-slate-900">FACTORY ASSET TAG</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-900 text-white rounded">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* QR Display Box */}
                <div className="w-32 h-32 flex-shrink-0 bg-white p-2 border border-slate-300 rounded-lg flex items-center justify-center">
                  <QRCodeSVG
                    value={qrUrl}
                    size={110}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>

                <div className="space-y-1 text-left flex-grow min-w-0">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Machine ID</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono tracking-tight truncate">
                    {mId || 'MC-SNLS-101'}
                  </div>

                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                    Make / Model
                  </div>
                  <div className="text-xs font-bold text-indigo-700 truncate">
                    {mBrand.toUpperCase()} • {mModel}
                  </div>

                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Class</div>
                  <div className="text-xs text-slate-700 truncate font-medium">
                    {typeNameMap[mType]}
                  </div>

                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                    Current Assignment
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 truncate">
                    {mLine} • {mStation}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>Scan with phone or shop terminal</span>
                <span>Reg: {mDate || new Date().toISOString().slice(0, 10)}</span>
              </div>
            </div>

            {/* Tag Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Asset Tag</span>
              </button>
              <button
                onClick={() => {
                  setScanModalTargetId(mId);
                  setIsScanModalOpen(true);
                }}
                className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Test QR Scan Action</span>
              </button>
            </div>
          </div>

          {/* Floor Scan Information Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Floor Scan Mechanics:</span>
            </div>
            <p className="text-indigo-900/80 leading-relaxed text-[11px]">
              When line operators or mechanics scan this physical label on the floor, the encoded URL{' '}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-800 border border-indigo-200">
                /scan/{mId}
              </code>{' '}
              opens two instantaneous mobile workflows: <b>1) Log Breakdown</b> (dispatches critical line stop) or <b>2) Relocate Machine</b> (rebalances production lines).
            </p>
          </div>
        </div>
      </div>

      {/* Registered Machines Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Registered Factory Machinery ({machines.length} Units)
            </h3>
            <p className="text-xs text-slate-500">
              Select any machine to load specifications into the tag generator or preview quick actions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search machine ID, make, line..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
              />
            </div>

            <select
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
            >
              <option value="ALL">All Lines</option>
              <option value="Line 01">Line 01</option>
              <option value="Line 02">Line 02</option>
              <option value="Line 03">Line 03</option>
              <option value="Line 04">Line 04</option>
              <option value="Buffer Workshop">Buffer Workshop</option>
              <option value="Scrap Bay">Scrap Bay</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Make / Model</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Current Line</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMachines.map((m) => {
                const isDown = m.status === 'BREAKDOWN';
                const isBuffer = m.status === 'BUFFER';

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => handleSelectForPreview(m)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{m.brand}</span>{' '}
                      <span className="text-slate-500">{m.model}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{m.typeName || m.type}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{m.currentLine}</td>
                    <td className="py-3 px-4 text-slate-600">{m.stationNo}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDown
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 urgent-pulse'
                            : isBuffer
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {m.ageYears ? `${m.ageYears} yrs` : 'New'}
                    </td>
                    <td
                      className="py-3 px-4 text-right space-x-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleSelectForPreview(m)}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                      >
                        Preview Tag
                      </button>
                      <button
                        onClick={() => {
                          setScanModalTargetId(m.id);
                          setIsScanModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-lg transition"
                      >
                        Simulate Scan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Scan Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        preselectedMachineId={scanModalTargetId || mId}
      />
    </div>
  );
}
