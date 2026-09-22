'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Wand2,
  Wrench,
  Tag,
  Printer,
  FileText,
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
import { PrintableAssetDocumentModal } from '@/components/print/PrintableAssetDocumentModal';
import {
  MACHINE_CATALOG,
  MachineCategoryGroup,
  SUBTYPE_LOOKUP,
  getCategoryForType,
} from '@/lib/machineCatalog';

export default function MachinesPage() {
  const { showToast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);

  // Machine form state
  const [mCategoryGroup, setMCategoryGroup] = useState<MachineCategoryGroup>('OVERLOCK');
  const [mId, setMId] = useState('MC-OVK-4TH-101');
  const [mBrand, setMBrand] = useState('Yamato');
  const [mType, setMType] = useState<MachineType>('OVERLOCK_4_THREAD');
  const [mModel, setMModel] = useState('AZ-8000G / 4-Thread High-Speed');
  const [mDate, setMDate] = useState('2023-04-12');
  const [mCost, setMCost] = useState<number>(980);
  const [mMotor, setMMotor] = useState<MotorType>('SERVO');
  const [mLine, setMLine] = useState<FloorLine>('Line 01');
  const [mStation, setMStation] = useState('Station 04');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLine, setFilterLine] = useState<string>('ALL');

  // Scanner modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanModalTargetId, setScanModalTargetId] = useState<string>('');

  // Print document modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalMachine, setPrintModalMachine] = useState<Machine | null>(null);
  const [printModalMode, setPrintModalMode] = useState<'TAG' | 'DOCUMENT' | 'BATCH'>('TAG');

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
    // 1. Overlock (Yamato, Supreme)
    OVERLOCK_4_THREAD: '4 Thread Overlock',
    OVERLOCK_RIB_THREAD: 'Rib Thread Overlock',
    OVERLOCK_LFC: 'LFC Overlock',
    // 2. Flatlock (Yamato)
    FLATLOCK_HEMMING: 'Hemming Flatlock',
    FLATLOCK_SMALL_CYLINDER: 'Small Cylinder Bed Flatlock',
    FLATLOCK_CYLINDER_BED: 'Cylinder Bed Flatlock',
    FLATLOCK_FLAT_BED: 'Flat Bed Flatlock',
    FLATLOCK_VT: 'VT Flatlock',
    FLATLOCK_TOP_ELASTIC: 'Top Elastic Flatlock',
    // 3. Single Needle Machine (Brother, Supreme)
    SN_BROTHER_KAJA: 'Brother KAJA (Buttonhole)',
    SN_BROTHER_BUTTON_STITCH: 'Brother Button Stitch',
    SN_BROTHER_BARTACK: 'Brother Bartack',
    // Legacy / Aliases
    SNLS: 'Single Needle Lockstitch (SNLS)',
    DNLS: 'Double Needle Lockstitch (DNLS)',
    OVERLOCK: '4-Thread Overlock / Safety Stitch',
    FLATLOCK: 'Flatlock / Interlock (Coverstitch)',
    BUTTONHOLE: 'Buttonhole Indexer',
    BARTACK: 'Electronic Bartack Machine',
    FEED_OFF_ARM: 'Feed-off-the-arm (FOTA)',
    CUTTING_MACHINE: 'Fabric End / Straight Knife Cutter',
    FUSING_PRESS: 'Collar / Cuff Fusing Press',
    MACHINE_CUSTOM: 'Custom Machinery',
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

  const handleCategoryChange = (cat: MachineCategoryGroup) => {
    setMCategoryGroup(cat);
    const rnd = Math.floor(100 + Math.random() * 900);
    if (cat === 'OVERLOCK') {
      setMType('OVERLOCK_4_THREAD');
      setMBrand('Yamato');
      setMModel('AZ-8000G / 4-Thread High-Speed');
      setMCost(980);
      setMId(`MC-OVK-4TH-${rnd}`);
    } else if (cat === 'FLATLOCK') {
      setMType('FLATLOCK_HEMMING');
      setMBrand('Yamato');
      setMModel('VG-2700-Hemming / UTT');
      setMCost(1550);
      setMId(`MC-FLK-HEM-${rnd}`);
    } else {
      setMType('SN_BROTHER_KAJA');
      setMBrand('Brother');
      setMModel('HE-800B KAJA Electronic');
      setMCost(1850);
      setMId(`MC-SN-KAJA-${rnd}`);
    }
  };

  const handleSubtypeChange = (type: MachineType) => {
    setMType(type);
    const meta = SUBTYPE_LOOKUP[type];
    if (meta) {
      setMModel(meta.defaultModel);
      setMBrand(meta.defaultBrand);
      const rnd = Math.floor(100 + Math.random() * 900);
      if (type.startsWith('OVERLOCK')) {
        setMId(`MC-OVK-${rnd}`);
        setMCost(980);
      } else if (type.startsWith('FLATLOCK')) {
        setMId(`MC-FLK-${rnd}`);
        setMCost(1600);
      } else {
        setMId(`MC-SN-${rnd}`);
        setMCost(1500);
      }
    }
  };

  const handleAutofill = () => {
    setMCategoryGroup('OVERLOCK');
    setMId('MC-OVK-4TH-204');
    setMBrand('Yamato');
    setMType('OVERLOCK_4_THREAD');
    setMModel('AZ-8000G / 4-Thread High-Speed');
    setMDate('2024-01-15');
    setMCost(980);
    setMMotor('SERVO');
    setMLine('Line 02');
    setMStation('Station 03');
    showToast('Sample Yamato 4-Thread Overlock loaded into form.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = mId.trim();
    if (!cleanId) return;

    const newMachine: Machine = {
      id: cleanId,
      name: `${mBrand} ${typeNameMap[mType] || mType} (${mModel})`,
      brand: mBrand,
      model: mModel.trim() || 'Standard Model',
      category: 'MACHINE',
      machineClass: mCategoryGroup,
      type: mType,
      typeName: typeNameMap[mType] || mType,
      motorType: mMotor,
      purchaseDate: mDate,
      cost: mCost,
      status: 'ACTIVE',
      currentLine: mLine,
      stationNo: mStation.trim() || 'Station 01',
      totalDowntimeMinutes: 0,
      ageYears: parseFloat(calculatedAge) || 0,
      specs: SUBTYPE_LOOKUP[mType]?.specs || '',
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
    const cat = getCategoryForType(m.type);
    setMCategoryGroup(cat);
    showToast(`Loaded ${m.id} for QR preview and editing`, 'info');
  };

  // Construct current active machine object for document preview & printing
  const currentMachineObj: Machine = useMemo(() => {
    const existing = machines.find((m) => m.id === mId);
    return {
      id: mId,
      name: `${mBrand} ${mModel}`,
      brand: mBrand,
      model: mModel,
      type: mType,
      typeName: typeNameMap[mType],
      cost: mCost,
      motorType: mMotor,
      currentLine: mLine,
      stationNo: mStation,
      purchaseDate: mDate,
      status: existing?.status || 'ACTIVE',
      category: 'MACHINE',
      department: 'Sewing Floor',
      operator: existing?.operator || 'Floor Operator',
      previousLine: existing?.previousLine,
      previousStation: existing?.previousStation,
      lastMovedAt: existing?.lastMovedAt,
      lastMovedReason: existing?.lastMovedReason,
      lastMovedBy: existing?.lastMovedBy,
      totalDowntimeMinutes: existing?.totalDowntimeMinutes || 0,
      ageYears: existing?.ageYears || 1.5,
    };
  }, [mId, mBrand, mModel, mType, mCost, mMotor, mLine, mStation, mDate, machines, typeNameMap]);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Machine Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 no-print">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>Machine Specifications</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Machine Category Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Machine Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {MACHINE_CATALOG.map((cat) => {
                  const isSelected = mCategoryGroup === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs">{cat.name}</div>
                      <div
                        className={`text-[11px] font-medium mt-1 ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        Brands: <span className="font-bold">{cat.brands.join(', ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtype and Brand Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Machine Subtype / Variety *
                </label>
                <select
                  required
                  value={mType}
                  onChange={(e) => handleSubtypeChange(e.target.value as MachineType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-bold"
                >
                  {MACHINE_CATALOG.find((c) => c.id === mCategoryGroup)?.subtypes.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block leading-tight">
                  {SUBTYPE_LOOKUP[mType]?.specs}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Brand / Make *
                </label>
                <select
                  required
                  value={mBrand}
                  onChange={(e) => setMBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-bold"
                >
                  {MACHINE_CATALOG.find((c) => c.id === mCategoryGroup)?.brands.map((b) => (
                    <option key={b} value={b}>
                      {b} OEM
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Strictly verified OEM brand for {MACHINE_CATALOG.find((c) => c.id === mCategoryGroup)?.name}
                </span>
              </div>
            </div>

            {/* Asset ID & Model Number */}
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
                  placeholder="e.g. MC-OVK-4TH-101"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Unique factory barcode / stencil</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Model Number / Spec *
                </label>
                <input
                  type="text"
                  required
                  value={mModel}
                  onChange={(e) => setMModel(e.target.value)}
                  placeholder="e.g. AZ-8000G / 4-Thread High-Speed"
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
                  Purchase Cost (₹ INR)
                </label>
                <input
                  type="number"
                  value={mCost}
                  onChange={(e) => setMCost(parseFloat(e.target.value) || 0)}
                  placeholder="65000"
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
                  Assigned Factory Department / Line
                </label>
                <select
                  value={mLine}
                  onChange={(e) => setMLine(e.target.value as FloorLine)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-semibold"
                >
                  <optgroup label="🧵 Sewing Floor Lines">
                    <option value="Line 01">Sewing Floor - Line 01</option>
                    <option value="Line 02">Sewing Floor - Line 02</option>
                    <option value="Line 03">Sewing Floor - Line 03</option>
                    <option value="Line 04">Sewing Floor - Line 04</option>
                  </optgroup>
                  <optgroup label="🏢 Plant Departments">
                    <option value="Cutting Department">Fabric Cutting Department</option>
                    <option value="Finishing & Pressing">Finishing & Steam Pressing</option>
                    <option value="Embroidery & Printing">Embroidery & Printing</option>
                    <option value="Quality & Packing">Quality Assurance & Packing</option>
                    <option value="Warehouse & Storage">Warehouse & Raw Materials</option>
                    <option value="Central Utilities & Plant">Central Utilities & Power Plant</option>
                    <option value="Maintenance Workshop">Maintenance Workshop & Tool Bay</option>
                    <option value="Scrap Bay">Scrap & Salvage Bay</option>
                  </optgroup>
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
        <div className="lg:col-span-5 space-y-4 print:w-full print:max-w-none print:m-0">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between no-print">
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

              {/* Where Held Before tracking info on printed tag */}
              {currentMachineObj.previousLine && (
                <div className="mt-2.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-700 bg-slate-50 px-2 py-1 rounded">
                  <span className="font-semibold text-slate-500">Held Before:</span>
                  <span className="font-bold text-slate-900">
                    {currentMachineObj.previousLine} {currentMachineObj.previousStation ? `(${currentMachineObj.previousStation})` : ''}
                  </span>
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>Motor: {mMotor || 'SERVO'}</span>
                <span>Valuation: ₹{mCost?.toLocaleString('en-IN') || '75,000'}</span>
                <span>Reg: {mDate || new Date().toISOString().slice(0, 10)}</span>
              </div>
            </div>

            {/* Tag Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Direct print thermal asset tag label"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Asset Tag</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintModalMachine(currentMachineObj);
                  setPrintModalMode('DOCUMENT');
                  setIsPrintModalOpen(true);
                }}
                className="w-full sm:flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Inspect printable document layout & equipment passport"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Preview</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanModalTargetId(mId);
                  setIsScanModalOpen(true);
                }}
                className="w-full sm:w-auto py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Simulate smartphone QR scan"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>
            </div>
          </div>

          {/* Floor Scan Information Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 space-y-1.5 no-print">
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
              <option value="ALL">All Factory Locations</option>
              <option value="Line 01">Sewing - Line 01</option>
              <option value="Line 02">Sewing - Line 02</option>
              <option value="Line 03">Sewing - Line 03</option>
              <option value="Line 04">Sewing - Line 04</option>
              <option value="Cutting Department">Cutting Dept</option>
              <option value="Finishing & Pressing">Finishing & Pressing</option>
              <option value="Embroidery & Printing">Embroidery & Printing</option>
              <option value="Quality & Packing">Quality & Packing</option>
              <option value="Warehouse & Storage">Warehouse & Storage</option>
              <option value="Central Utilities & Plant">Utilities & Plant</option>
              <option value="Maintenance Workshop">Maintenance Workshop</option>
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
                          setPrintModalMachine(m);
                          setPrintModalMode('TAG');
                          setIsPrintModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
                        title="Print QR Tag or Equipment Document"
                      >
                        Print Tag / Doc
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

      {/* Printable Asset Document Modal */}
      {printModalMachine && (
        <PrintableAssetDocumentModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          asset={printModalMachine}
          allAssets={filteredMachines}
          initialMode={printModalMode}
        />
      )}
    </div>
  );
}
