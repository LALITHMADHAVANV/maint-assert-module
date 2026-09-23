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
  LayoutGrid,
  Armchair,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Machine, MachineType, MotorType, FloorLine, MachineStatus, AssetCategory } from '@/types/cmms';
import { subscribeMachines, createMachine } from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { ScanModal } from '@/components/scan/ScanModal';
import { PrintableAssetDocumentModal } from '@/components/print/PrintableAssetDocumentModal';
import {
  ASSET_CATEGORIES,
  ALL_ASSET_SUBTYPES,
  ASSET_SUBTYPE_LOOKUP,
  getAssetCategoryForType,
  AssetSubtypeDef,
} from '@/lib/machineCatalog';

const SAMPLE_ASSETS = [
  {
    category: 'MACHINE' as AssetCategory,
    idPrefix: 'MC-OVK-4TH-',
    brand: 'Yamato',
    type: 'OVERLOCK_4_THREAD' as MachineType,
    model: 'AZ-8000G / 4-Thread High-Speed',
    date: '2023-04-12',
    cost: 98000,
    motor: 'SERVO' as MotorType,
    line: 'Line 01' as FloorLine,
    station: 'Station 04',
    specs: '4-thread safety stitch, differential feed ratio 1:0.7–1:2, max 7,500 RPM, auto-lubrication',
    label: 'Yamato 4-Thread Overlock Machine',
  },
  {
    category: 'TABLE' as AssetCategory,
    idPrefix: 'TBL-CUT-',
    brand: 'Eastman',
    type: 'TABLE_CUTTING' as MachineType,
    model: 'MasterSpread Air-Float 12ft x 6ft',
    date: '2023-02-18',
    cost: 65000,
    motor: 'SERVO' as MotorType,
    line: 'Cutting Department' as FloorLine,
    station: 'Spreading Table Bay 01',
    specs: '12ft x 6ft laminated micro-perforated table with air-cushion blower and steel side guide rails',
    label: 'Eastman Air-Float Fabric Spreading Table',
  },
  {
    category: 'CHAIR' as AssetCategory,
    idPrefix: 'CHR-OPR-',
    brand: 'Featherlite',
    type: 'CHAIR_OPERATOR' as MachineType,
    model: 'Optima-Sewing Swivel 360',
    date: '2023-08-10',
    cost: 4500,
    motor: 'SERVO' as MotorType,
    line: 'Line 02' as FloorLine,
    station: 'Station 07',
    specs: 'Pneumatic height adjustment, heavy-duty polyurethane seat, 360° swivel with lumbar support',
    label: 'Featherlite Ergonomic Operator Swivel Chair',
  },
  {
    category: 'UTILITY' as AssetCategory,
    idPrefix: 'UTL-HBY-',
    brand: 'Philips',
    type: 'LIGHT_HIGHBAY' as MachineType,
    model: 'CoreLine HighBay 120W',
    date: '2023-05-22',
    cost: 7500,
    motor: 'SERVO' as MotorType,
    line: 'Central Utilities & Plant' as FloorLine,
    station: 'Ceiling Grid Bay C',
    specs: '120W, 16,000 Lumen, 6500K Day White, IP65 dust and textile fiber resistant',
    label: 'Philips 120W High-Bay Overhead LED Fixture',
  },
];

export default function MachinesPage() {
  const { showToast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);

  // Asset Form State
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('MACHINE');
  const [mId, setMId] = useState('MC-OVK-4TH-101');
  const [mBrand, setMBrand] = useState('Yamato');
  const [mType, setMType] = useState<MachineType>('OVERLOCK_4_THREAD');
  const [mModel, setMModel] = useState('AZ-8000G / 4-Thread High-Speed');
  const [mDate, setMDate] = useState('2023-04-12');
  const [mCost, setMCost] = useState<number>(98000);
  const [mMotor, setMMotor] = useState<MotorType>('SERVO');
  const [mLine, setMLine] = useState<FloorLine>('Line 01');
  const [mStation, setMStation] = useState('Station 04');

  // Search & Filters for Assets Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLine, setFilterLine] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Scanner modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanModalTargetId, setScanModalTargetId] = useState<string>('');

  // Print document modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalMachine, setPrintModalMachine] = useState<Machine | null>(null);
  const [printModalMode, setPrintModalMode] = useState<'TAG' | 'DOCUMENT' | 'BATCH'>('TAG');

  // Sample index for autofill cycling
  const [sampleIdx, setSampleIdx] = useState(0);

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

  // Compute machine/asset age dynamically
  const calculatedAge = useMemo(() => {
    if (!mDate) return 'New Asset';
    const pDate = new Date(mDate);
    const now = new Date();
    const diff = (now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diff > 0 ? `${diff.toFixed(1)} Years` : 'New Asset';
  }, [mDate]);

  // Current category definition
  const currentCategoryDef = useMemo(() => {
    return ASSET_CATEGORIES.find((c) => c.id === selectedCategory) || ASSET_CATEGORIES[0];
  }, [selectedCategory]);

  // Available brands for the current subtype or category
  const availableBrands: string[] = useMemo(() => {
    const subDef = ASSET_SUBTYPE_LOOKUP[mType];
    if (subDef && subDef.brands && subDef.brands.length > 0) {
      return subDef.brands;
    }
    const catBrands = Array.from(new Set(currentCategoryDef.subtypes.flatMap((s) => s.brands)));
    return catBrands.length > 0 ? catBrands : ['Generic OEM'];
  }, [mType, currentCategoryDef]);

  // Handler for category switch
  const handleCategorySelect = (cat: AssetCategory) => {
    setSelectedCategory(cat);
    const catDef = ASSET_CATEGORIES.find((c) => c.id === cat) || ASSET_CATEGORIES[0];
    const firstSub = catDef.subtypes[0];
    if (firstSub) {
      const rnd = Math.floor(100 + Math.random() * 900);
      setMType(firstSub.id);
      setMBrand(firstSub.defaultBrand);
      setMModel(firstSub.defaultModel);
      setMCost(firstSub.defaultCost);
      setMId(`${firstSub.idPrefix}${rnd}`);
    }
  };

  // Handler for subtype change
  const handleSubtypeChange = (type: MachineType) => {
    setMType(type);
    const meta = ASSET_SUBTYPE_LOOKUP[type];
    if (meta) {
      setMModel(meta.defaultModel);
      setMBrand(meta.defaultBrand);
      setMCost(meta.defaultCost);
      const rnd = Math.floor(100 + Math.random() * 900);
      setMId(`${meta.idPrefix}${rnd}`);
    }
  };

  // Handler for autofill sample
  const handleAutofill = () => {
    const s = SAMPLE_ASSETS[sampleIdx % SAMPLE_ASSETS.length];
    setSampleIdx((prev) => prev + 1);

    const rnd = Math.floor(100 + Math.random() * 900);
    setSelectedCategory(s.category);
    setMId(`${s.idPrefix}${rnd}`);
    setMBrand(s.brand);
    setMType(s.type);
    setMModel(s.model);
    setMDate(s.date);
    setMCost(s.cost);
    setMMotor(s.motor);
    setMLine(s.line);
    setMStation(s.station);

    showToast(`Loaded sample: ${s.label} into form.`, 'info');
  };

  // Handler for form submit & registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = mId.trim();
    if (!cleanId) return;

    const typeName = ASSET_SUBTYPE_LOOKUP[mType]?.name || mType;
    const newAsset: Machine = {
      id: cleanId,
      name: `${mBrand} ${typeName} (${mModel})`,
      brand: mBrand,
      model: mModel.trim() || 'Standard Model',
      category: selectedCategory,
      machineClass:
        selectedCategory === 'MACHINE'
          ? mType.startsWith('OVERLOCK')
            ? 'OVERLOCK'
            : mType.startsWith('FLATLOCK')
            ? 'FLATLOCK'
            : 'SINGLE_NEEDLE'
          : undefined,
      type: mType,
      typeName: typeName,
      motorType: mMotor,
      purchaseDate: mDate,
      cost: mCost,
      status: 'ACTIVE',
      currentLine: mLine,
      stationNo: mStation.trim() || 'Station 01',
      totalDowntimeMinutes: 0,
      ageYears: parseFloat(calculatedAge) || 0,
      specs: ASSET_SUBTYPE_LOOKUP[mType]?.specs || '',
    };

    try {
      await createMachine(newAsset);
      showToast(`Asset ${cleanId} registered & QR sticker generated!`, 'success');
    } catch (err) {
      showToast('Failed to register asset', 'error');
      console.error(err);
    }
  };

  // Handler to load any asset into the preview card
  const handleSelectForPreview = (m: Machine) => {
    const cat = m.category || getAssetCategoryForType(m.type);
    setSelectedCategory(cat);
    setMId(m.id);
    setMBrand(m.brand);
    setMType(m.type);
    setMModel(m.model);
    setMDate(m.purchaseDate || '2023-01-01');
    setMCost(m.cost || 5000);
    setMMotor(m.motorType || 'SERVO');
    setMLine(m.currentLine);
    setMStation(m.stationNo);
    showToast(`Loaded ${m.id} (${m.brand} ${m.model}) for QR preview and editing`, 'info');
  };

  // Construct current active asset object for document preview & printing
  const currentMachineObj: Machine = useMemo(() => {
    const existing = machines.find((m) => m.id === mId);
    const typeName = ASSET_SUBTYPE_LOOKUP[mType]?.name || mType;
    return {
      id: mId,
      name: `${mBrand} ${mModel}`,
      brand: mBrand,
      model: mModel,
      type: mType,
      typeName: typeName,
      cost: mCost,
      motorType: mMotor,
      currentLine: mLine,
      stationNo: mStation,
      purchaseDate: mDate,
      status: existing?.status || 'ACTIVE',
      category: selectedCategory,
      department: (mLine.includes('Line') ? 'Sewing Floor' : mLine) as any,
      operator: existing?.operator || 'Plant Operator',
      previousLine: existing?.previousLine,
      previousStation: existing?.previousStation,
      lastMovedAt: existing?.lastMovedAt,
      lastMovedReason: existing?.lastMovedReason,
      lastMovedBy: existing?.lastMovedBy,
      totalDowntimeMinutes: existing?.totalDowntimeMinutes || 0,
      ageYears: existing?.ageYears || 1.2,
      specs: ASSET_SUBTYPE_LOOKUP[mType]?.specs || '',
    };
  }, [mId, mBrand, mModel, mType, mCost, mMotor, mLine, mStation, mDate, machines, selectedCategory]);

  const handlePrint = () => {
    window.print();
  };

  // Encoded QR payload feeding all asset specifications into the QR code
  const qrData = useMemo(() => {
    const base = `${origin}/scan/${encodeURIComponent(mId)}`;
    const params = new URLSearchParams({
      id: mId || '',
      brand: mBrand || '',
      model: mModel || '',
      type: mType || '',
      typeName: ASSET_SUBTYPE_LOOKUP[mType]?.name || mType || '',
      category: selectedCategory || '',
      line: mLine || '',
      station: mStation || '',
      motor: mMotor || '',
      date: mDate || '',
      cost: mCost ? String(mCost) : '',
    });
    return `${base}?${params.toString()}`;
  }, [origin, mId, mBrand, mModel, mType, selectedCategory, mLine, mStation, mMotor, mDate, mCost]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = { ALL: machines.length, MACHINE: 0, TABLE: 0, CHAIR: 0, UTILITY: 0 };
    machines.forEach((m) => {
      const cat = m.category || getAssetCategoryForType(m.type);
      if (cat === 'TABLE') counts.TABLE++;
      else if (cat === 'CHAIR') counts.CHAIR++;
      else if (cat === 'UTILITY' || cat === 'LIGHT' || cat === 'FAN') counts.UTILITY++;
      else counts.MACHINE++;
    });
    return counts;
  }, [machines]);

  // Filtered assets table
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const cat = m.category || getAssetCategoryForType(m.type);
      const matchesCategory =
        filterCategory === 'ALL'
          ? true
          : filterCategory === 'UTILITY'
          ? cat === 'UTILITY' || cat === 'LIGHT' || cat === 'FAN'
          : cat === filterCategory;

      const matchesSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.typeName && m.typeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.currentLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.stationNo && m.stationNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLine = filterLine === 'ALL' || m.currentLine === filterLine;
      return matchesCategory && matchesSearch && matchesLine;
    });
  }, [machines, searchQuery, filterLine, filterCategory]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <span>Plant Asset Registry &amp; Instant QR Generation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register every factory asset &mdash; sewing machinery, cutting tables, operator seating, high-bay lighting &amp; utilities &mdash; and generate printable QR stickers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutofill}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Autofill Sample Asset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form (Left) & QR Tag Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Asset Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 no-print">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>Asset Specifications</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Asset Category Selection Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Factory Asset Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ASSET_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {cat.id === 'MACHINE' && (
                          <Wrench className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                        )}
                        {cat.id === 'TABLE' && (
                          <LayoutGrid className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                        )}
                        {cat.id === 'CHAIR' && (
                          <Armchair className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                        )}
                        {cat.id === 'UTILITY' && (
                          <Zap className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-cyan-600'}`} />
                        )}
                        <span>{cat.singular}</span>
                      </div>
                      <div
                        className={`text-[10px] font-medium mt-1 truncate ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        {cat.subtypes.length} Varieties
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
                  Asset Variety / Model Subtype *
                </label>
                <select
                  required
                  value={mType}
                  onChange={(e) => handleSubtypeChange(e.target.value as MachineType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-bold"
                >
                  {currentCategoryDef.subtypes.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block leading-tight">
                  {ASSET_SUBTYPE_LOOKUP[mType]?.specs || 'Standard industrial plant specification'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Brand / Manufacturer OEM *
                </label>
                <select
                  required
                  value={mBrand}
                  onChange={(e) => setMBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800 font-bold"
                >
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b} OEM
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Verified supplier for {currentCategoryDef.singular}
                </span>
              </div>
            </div>

            {/* Asset ID & Model Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Asset ID (Barcode / QR Unique Tag) *
                </label>
                <input
                  type="text"
                  required
                  value={mId}
                  onChange={(e) => setMId(e.target.value)}
                  placeholder="e.g. MC-OVK-4TH-101"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">Unique factory barcode / physical stencil</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Model Series / Specification *
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

            {/* Date, Age, and Valuation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Installation / Purchase Date *
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
                  Calculated Asset Age
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
                  Capital Valuation (₹ INR)
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

            {/* Power / Drive, Department, and Station */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedCategory === 'MACHINE' ? (
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
              ) : selectedCategory === 'UTILITY' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Power Connection
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="220V AC / 415V Three-Phase"
                    className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-medium outline-none cursor-not-allowed"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Asset Power Class
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Non-Powered Industrial Asset"
                    className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-medium outline-none cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assigned Factory Location *
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
                  Floor Bay / Station No.
                </label>
                <input
                  type="text"
                  value={mStation}
                  onChange={(e) => setMStation(e.target.value)}
                  placeholder="Station 08 / Bay 02"
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
                <span>Register Asset &amp; Render QR Tag</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 Columns: Printable QR Sticker Preview */}
        <div className="lg:col-span-5 space-y-4 print:w-full print:max-w-none print:m-0">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between no-print">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Asset QR Sticker Preview</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded uppercase">
                Ready to Paste
              </span>
            </div>

            {/* Printable Sticker: Only QR and Asset ID */}
            <div
              id="printable-qr-tag"
              className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center mx-auto max-w-[280px] print:border-2 print:border-black print:rounded-none print:shadow-none print:p-4 print:m-auto"
            >
              {/* High-Resolution QR Code containing all asset specifications */}
              <div className="p-3 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-xs">
                <QRCodeSVG
                  value={qrData}
                  size={180}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* Asset Identifier */}
              <div className="mt-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Asset ID
                </div>
                <div className="text-lg font-black text-slate-950 font-mono tracking-wide">
                  {mId || 'ASSET-101'}
                </div>
              </div>
            </div>

            {/* Tag Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Direct print QR sticker for asset"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Sticker</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintModalMachine(currentMachineObj);
                  setPrintModalMode('TAG');
                  setIsPrintModalOpen(true);
                }}
                className="w-full sm:flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Inspect printable sticker & batch sheet"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Options</span>
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
              opens instantaneous mobile workflows: <b>1) Log Breakdown / Defect</b> (triggers mechanic dispatch) or <b>2) Relocate Asset</b> (rebalances factory departments).
            </p>
          </div>
        </div>
      </div>

      {/* Registered Factory Assets Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Registered Factory Assets ({machines.length} Total Units)
            </h3>
            <p className="text-xs text-slate-500">
              Select any asset to load specifications into the tag generator or preview quick actions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search asset ID, make, line..."
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
              <option value="Finishing & Pressing">Finishing &amp; Pressing</option>
              <option value="Embroidery & Printing">Embroidery &amp; Printing</option>
              <option value="Quality & Packing">Quality &amp; Packing</option>
              <option value="Warehouse & Storage">Warehouse &amp; Storage</option>
              <option value="Central Utilities & Plant">Utilities &amp; Plant</option>
              <option value="Maintenance Workshop">Maintenance Workshop</option>
              <option value="Scrap Bay">Scrap Bay</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Assets</span>
            <span className="text-[10px] opacity-75 font-mono">({categoryCounts.ALL})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('MACHINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'MACHINE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>Machinery</span>
            <span className="text-[10px] opacity-75 font-mono">({categoryCounts.MACHINE})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('TABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'TABLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Tables</span>
            <span className="text-[10px] opacity-75 font-mono">({categoryCounts.TABLE})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('CHAIR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'CHAIR'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Armchair className="w-3 h-3" />
            <span>Chairs &amp; Seating</span>
            <span className="text-[10px] opacity-75 font-mono">({categoryCounts.CHAIR})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('UTILITY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'UTILITY'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Utilities &amp; Lighting</span>
            <span className="text-[10px] opacity-75 font-mono">({categoryCounts.UTILITY})</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Make / Model</th>
                <th className="py-3 px-4">Subtype Spec</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Station / Bay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMachines.map((m) => {
                const isDown = m.status === 'BREAKDOWN';
                const isBuffer = m.status === 'BUFFER';
                const cat = m.category || getAssetCategoryForType(m.type);

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => handleSelectForPreview(m)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cat === 'TABLE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cat === 'CHAIR'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : cat === 'UTILITY' || cat === 'LIGHT' || cat === 'FAN'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {cat === 'TABLE' && <LayoutGrid className="w-2.5 h-2.5" />}
                        {cat === 'CHAIR' && <Armchair className="w-2.5 h-2.5" />}
                        {(cat === 'UTILITY' || cat === 'LIGHT' || cat === 'FAN') && (
                          <Zap className="w-2.5 h-2.5" />
                        )}
                        {cat === 'MACHINE' && <Wrench className="w-2.5 h-2.5" />}
                        <span>{cat}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{m.brand}</span>{' '}
                      <span className="text-slate-500">{m.model}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {m.typeName || ASSET_SUBTYPE_LOOKUP[m.type]?.name || m.type}
                    </td>
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
