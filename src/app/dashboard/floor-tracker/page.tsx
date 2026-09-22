'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowRight,
  Factory,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  Search,
  Filter,
  Wrench,
  Lightbulb,
  Fan,
  Armchair,
  LayoutGrid,
  SlidersHorizontal,
  RefreshCw,
  Flame,
  X,
  Tag,
  Maximize2,
  Boxes,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Machine, FloorLine, AssetCategory, MachineType, MachineStatus } from '@/types/cmms';
import { subscribeMachines, createMachine, resetToSeedData } from '@/lib/services/cmmsService';
import { ScanModal } from '@/components/scan/ScanModal';
import { AssetTypeCatalogModal } from '@/components/floor/AssetTypeCatalogModal';
import { useToast } from '@/context/ToastContext';

interface LineDefinition {
  name: FloorLine;
  desc: string;
  badgeBg: string;
}

export function getCategoryMeta(category?: AssetCategory) {
  switch (category) {
    case 'TABLE':
      return {
        label: 'Work Table',
        plural: 'Work Tables',
        icon: LayoutGrid,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
        cardBorder: 'hover:border-amber-400',
      };
    case 'CHAIR':
      return {
        label: 'Ergonomic Chair',
        plural: 'Chairs & Seating',
        icon: Armchair,
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        badge: 'bg-teal-100 text-teal-800 border-teal-300',
        dot: 'bg-teal-500',
        cardBorder: 'hover:border-teal-400',
      };
    case 'LIGHT':
      return {
        label: 'Lighting Fixture',
        plural: 'Lighting Fixtures',
        icon: Lightbulb,
        color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        dot: 'bg-yellow-500',
        cardBorder: 'hover:border-yellow-400',
      };
    case 'FAN':
      return {
        label: 'Fan / Ventilation',
        plural: 'Fans & Ventilation',
        icon: Fan,
        color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        dot: 'bg-cyan-500',
        cardBorder: 'hover:border-cyan-400',
      };
    case 'UTILITY':
      return {
        label: 'Plant Utility',
        plural: 'Central Utilities',
        icon: Flame,
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        dot: 'bg-purple-500',
        cardBorder: 'hover:border-purple-400',
      };
    case 'MACHINE':
    default:
      return {
        label: 'Machinery',
        plural: 'Production Machinery',
        icon: Wrench,
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        dot: 'bg-indigo-500',
        cardBorder: 'hover:border-indigo-400',
      };
  }
}

export default function FloorTrackerPage() {
  const { showToast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveMachineId, setTargetMoveMachineId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Catalog Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [catalogTypeId, setCatalogTypeId] = useState<string | undefined>(undefined);

  const handleOpenCatalog = (cat: AssetCategory | 'ALL' = 'ALL', typeId?: string) => {
    setCatalogCategory(cat);
    setCatalogTypeId(typeId);
    setIsCatalogModalOpen(true);
  };

  // Filters & Views
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LINES' | 'WORKSTATIONS'>('LINES');

  // New Asset Form State
  const [newCategory, setNewCategory] = useState<AssetCategory>('TABLE');
  const [newId, setNewId] = useState(`TBL-CUT-${Math.floor(100 + Math.random() * 900)}`);
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('Featherlite');
  const [newModel, setNewModel] = useState('HeavyCraft-100');
  const [newLine, setNewLine] = useState<FloorLine>('Line 01');
  const [newStation, setNewStation] = useState('Station 04');
  const [newCost, setNewCost] = useState<number>(250);
  const [newSpecs, setNewSpecs] = useState('');
  const [newStatus, setNewStatus] = useState<MachineStatus>('ACTIVE');

  useEffect(() => {
    const unsub = subscribeMachines((data) => setMachines(data));
    return () => unsub();
  }, []);

  // Sync / Reset to full dataset
  const handleSyncAllAssets = async () => {
    setIsSyncing(true);
    try {
      await resetToSeedData();
      showToast('Successfully synchronized all 40+ factory assets across lines and workstations!', 'success');
    } catch (err) {
      showToast('Error syncing factory asset database', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // KPIs
  const totalAssets = machines.length;
  const totalValuation = useMemo(
    () => machines.reduce((acc, m) => acc + (m.cost || 0), 0),
    [machines]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      MACHINE: 0,
      TABLE: 0,
      CHAIR: 0,
      LIGHT: 0,
      FAN: 0,
      UTILITY: 0,
    };
    machines.forEach((m) => {
      const cat = m.category || 'MACHINE';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [machines]);

  const statusCounts = useMemo(() => {
    let active = 0;
    let breakdown = 0;
    let buffer = 0;
    let scrap = 0;
    machines.forEach((m) => {
      if (m.status === 'ACTIVE') active++;
      else if (m.status === 'BREAKDOWN') breakdown++;
      else if (m.status === 'BUFFER') buffer++;
      else if (m.status === 'SCRAP') scrap++;
    });
    return { active, breakdown, buffer, scrap };
  }, [machines]);

  const floorLines: LineDefinition[] = [
    {
      name: 'Line 01',
      desc: 'Polo Shirt & Knit Seam Line',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      name: 'Line 02',
      desc: 'Basic T-Shirt Assembly Line',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'Line 03',
      desc: 'Woven Shirts & Buttoning Line',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      name: 'Line 04',
      desc: 'Denim & Twill Heavy Line',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    {
      name: 'Buffer Workshop',
      desc: 'Mechanic Bay & Standby Pool',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'Scrap Bay',
      desc: 'Cannibalization & Salvage Rack',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  // Filtering
  const filteredAssets = useMemo(() => {
    return machines.filter((m) => {
      // Category filter
      const cat = m.category || 'MACHINE';
      if (activeCategory !== 'ALL' && cat !== activeCategory) return false;

      // Line filter
      if (selectedLineFilter !== 'ALL' && m.currentLine !== selectedLineFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = m.id.toLowerCase().includes(query);
        const matchBrand = (m.brand || '').toLowerCase().includes(query);
        const matchModel = (m.model || '').toLowerCase().includes(query);
        const matchStation = (m.stationNo || '').toLowerCase().includes(query);
        const matchName = (m.name || '').toLowerCase().includes(query);
        const matchOperator = (m.operator || '').toLowerCase().includes(query);
        const matchSpecs = (m.specs || '').toLowerCase().includes(query);
        if (!matchId && !matchBrand && !matchModel && !matchStation && !matchName && !matchOperator && !matchSpecs) {
          return false;
        }
      }

      return true;
    });
  }, [machines, activeCategory, selectedLineFilter, searchQuery]);

  // Workstation Setup Matrix grouping
  const workstationMatrix = useMemo(() => {
    const map: Record<
      string,
      {
        line: FloorLine;
        station: string;
        table?: Machine;
        machine?: Machine;
        chair?: Machine;
        light?: Machine;
        fan?: Machine;
        utility?: Machine;
        others: Machine[];
      }
    > = {};

    machines.forEach((item) => {
      if (item.currentLine === 'Scrap Bay') return;
      const key = `${item.currentLine}___${item.stationNo}`;
      if (!map[key]) {
        map[key] = {
          line: item.currentLine,
          station: item.stationNo,
          others: [],
        };
      }
      const cat = item.category || 'MACHINE';
      if (cat === 'TABLE' && !map[key].table) map[key].table = item;
      else if (cat === 'MACHINE' && !map[key].machine) map[key].machine = item;
      else if (cat === 'CHAIR' && !map[key].chair) map[key].chair = item;
      else if (cat === 'LIGHT' && !map[key].light) map[key].light = item;
      else if (cat === 'FAN' && !map[key].fan) map[key].fan = item;
      else if (cat === 'UTILITY' && !map[key].utility) map[key].utility = item;
      else map[key].others.push(item);
    });

    let list = Object.values(map);
    if (selectedLineFilter !== 'ALL') {
      list = list.filter((ws) => ws.line === selectedLineFilter);
    }
    return list;
  }, [machines, selectedLineFilter]);

  const handleOpenMove = (assetId: string) => {
    setTargetMoveMachineId(assetId);
    setIsMoveModalOpen(true);
  };

  const handleCategoryChangeInForm = (cat: AssetCategory) => {
    setNewCategory(cat);
    const rnd = Math.floor(100 + Math.random() * 900);
    switch (cat) {
      case 'TABLE':
        setNewId(`TBL-SEW-${rnd}`);
        setNewBrand('Featherlite');
        setNewModel('StitchDesk-Pro');
        setNewCost(180);
        setNewSpecs('Laminated top with metric measurement rule & drawer');
        break;
      case 'CHAIR':
        setNewId(`CHR-ERG-${rnd}`);
        setNewBrand('Featherlite');
        setNewModel('Optima-Sew360');
        setNewCost(85);
        setNewSpecs('Ergonomic gas-lift pneumatic swivel chair with lumbar support');
        break;
      case 'LIGHT':
        setNewId(`LGT-HBY-${rnd}`);
        setNewBrand('Philips');
        setNewModel('CoreLine-150W');
        setNewCost(130);
        setNewSpecs('150W Linear High-Bay LED, 6500K Cool Daylight, IP65');
        break;
      case 'FAN':
        setNewId(`FAN-IND-${rnd}`);
        setNewBrand('Havells');
        setNewModel('IndusAir-56');
        setNewCost(70);
        setNewSpecs('56-inch aluminum heavy aeroblades, 320 RPM copper motor');
        break;
      case 'UTILITY':
        setNewId(`UTL-SYS-${rnd}`);
        setNewBrand('Silver Star');
        setNewModel('UtilityMaster');
        setNewCost(1200);
        setNewSpecs('Plant support infrastructure with safety shutoff valve');
        break;
      case 'MACHINE':
      default:
        setNewId(`MC-SNLS-${rnd}`);
        setNewBrand('Juki');
        setNewModel('DDL-8700-7');
        setNewCost(750);
        setNewSpecs('Direct-drive servo, auto trimmer, 5000 RPM');
        break;
    }
  };

  const handleCreateAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) {
      showToast('Please enter an Asset ID', 'warning');
      return;
    }

    const typeMapping: Record<AssetCategory, MachineType> = {
      MACHINE: 'SNLS',
      TABLE: 'TABLE_SEWING',
      CHAIR: 'CHAIR_OPERATOR',
      LIGHT: 'LIGHT_HIGHBAY',
      FAN: 'FAN_CEILING',
      UTILITY: 'UTILITY_BOILER',
    };

    const newAsset: Machine = {
      id: newId.trim().toUpperCase(),
      name: newName.trim() || `${newBrand} ${getCategoryMeta(newCategory).label} (${newLine})`,
      brand: newBrand.trim() || 'Generic',
      model: newModel.trim() || 'Standard',
      category: newCategory,
      type: typeMapping[newCategory],
      typeName: `${newBrand} ${getCategoryMeta(newCategory).label}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      cost: Number(newCost) || 100,
      status: newStatus,
      currentLine: newLine,
      stationNo: newStation.trim() || 'Station 01',
      totalDowntimeMinutes: 0,
      ageYears: 0.1,
      specs: newSpecs.trim(),
    };

    try {
      await createMachine(newAsset);
      showToast(`Asset ${newAsset.id} registered and staged at ${newLine}!`, 'success');
      setIsAddModalOpen(false);
    } catch (err) {
      showToast('Failed to register asset', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Factory Asset Floor Grid & Staging Suite
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Floor Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Live interactive audit of all factory physical assets across every sewing line and workstation. Tracks{' '}
            <strong className="text-slate-700">machinery</strong>,{' '}
            <strong className="text-slate-700">work tables</strong>,{' '}
            <strong className="text-slate-700">ergonomic chairs</strong>,{' '}
            <strong className="text-slate-700">lighting fixtures</strong>,{' '}
            <strong className="text-slate-700">ventilation fans</strong>, and{' '}
            <strong className="text-slate-700">utilities</strong>.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSyncAllAssets}
            disabled={isSyncing}
            className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            title="Reset and sync all 40+ realistic apparel factory assets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Factory Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCategoryChangeInForm('TABLE');
              setIsAddModalOpen(true);
            }}
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Factory Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip Across All Asset Classes With Embedded Type Catalog Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Assets & Valuation */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Total Capital</span>
              <Building className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold text-indigo-700 font-mono">
              ${totalValuation.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">{totalAssets} Total Assets</div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCatalog('ALL')}
            className="mt-2.5 w-full text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Master Asset Types Catalog (18 Types)"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-600" />
              <span>Catalog (18)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-slate-400">→</span>
          </button>
        </div>

        {/* 🧵 Machinery */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'MACHINE' ? 'ALL' : 'MACHINE')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition flex flex-col justify-between ${
            activeCategory === 'MACHINE'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              <span>Machinery</span>
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {categoryCounts.MACHINE || 0}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Sewing & Cutting</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCatalog('MACHINE');
            }}
            className="mt-2.5 w-full text-[10px] font-bold text-indigo-700 bg-indigo-100/90 hover:bg-indigo-200 border border-indigo-200 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Machine Types Catalog & SOP"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-600" />
              <span>Catalog (6 Types)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-indigo-500">→</span>
          </button>
        </div>

        {/* 🪵 Work Tables */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'TABLE' ? 'ALL' : 'TABLE')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition flex flex-col justify-between ${
            activeCategory === 'TABLE'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              <span>Work Tables</span>
              <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {categoryCounts.TABLE || 0}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Cutting & Inspection</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCatalog('TABLE');
            }}
            className="mt-2.5 w-full text-[10px] font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 border border-amber-200 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Work Table Types Catalog & Dimensions"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-700" />
              <span>Catalog (3 Types)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-amber-600">→</span>
          </button>
        </div>

        {/* 🪑 Chairs & Seating */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'CHAIR' ? 'ALL' : 'CHAIR')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition flex flex-col justify-between ${
            activeCategory === 'CHAIR'
              ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400'
              : 'bg-white border-slate-200 hover:border-teal-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 uppercase tracking-wider">
              <span>Chairs & Seats</span>
              <Armchair className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {categoryCounts.CHAIR || 0}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Swivel & Stools</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCatalog('CHAIR');
            }}
            className="mt-2.5 w-full text-[10px] font-bold text-teal-800 bg-teal-100/90 hover:bg-teal-200 border border-teal-200 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Chair Types Catalog & Ergonomics"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-teal-700" />
              <span>Catalog (3 Types)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-teal-600">→</span>
          </button>
        </div>

        {/* 💡 Lighting Fixtures */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'LIGHT' ? 'ALL' : 'LIGHT')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition flex flex-col justify-between ${
            activeCategory === 'LIGHT'
              ? 'bg-yellow-50/80 border-yellow-300 ring-2 ring-yellow-400'
              : 'bg-white border-slate-200 hover:border-yellow-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-yellow-700 uppercase tracking-wider">
              <span>Lighting</span>
              <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {categoryCounts.LIGHT || 0}
            </div>
            <div className="text-[11px] text-slate-500 truncate">High-Bay & Task</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCatalog('LIGHT');
            }}
            className="mt-2.5 w-full text-[10px] font-bold text-yellow-800 bg-yellow-100/90 hover:bg-yellow-200 border border-yellow-200 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Lighting Types Catalog & Lux"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-yellow-700" />
              <span>Catalog (3 Types)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-yellow-600">→</span>
          </button>
        </div>

        {/* 💨 Fans & Ventilation */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'FAN' ? 'ALL' : 'FAN')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition flex flex-col justify-between ${
            activeCategory === 'FAN'
              ? 'bg-cyan-50/80 border-cyan-300 ring-2 ring-cyan-400'
              : 'bg-white border-slate-200 hover:border-cyan-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
              <span>Fans & Air</span>
              <Fan className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {categoryCounts.FAN || 0}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Ceiling & Blowers</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCatalog('FAN');
            }}
            className="mt-2.5 w-full text-[10px] font-bold text-cyan-800 bg-cyan-100/90 hover:bg-cyan-200 border border-cyan-200 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Fan Types Catalog & Air Flow"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-cyan-700" />
              <span>Catalog (2 Types)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-cyan-600">→</span>
          </button>
        </div>

        {/* ⚡ Utilities & Plant */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'UTILITY' ? 'ALL' : 'UTILITY')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition flex flex-col justify-between ${
            activeCategory === 'UTILITY'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400'
              : 'bg-white border-slate-200 hover:border-purple-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-purple-700 uppercase tracking-wider">
              <span>Utilities</span>
              <Flame className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {categoryCounts.UTILITY || 0}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Boilers & Compressors</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCatalog('UTILITY');
            }}
            className="mt-2.5 w-full text-[10px] font-bold text-purple-800 bg-purple-100/90 hover:bg-purple-200 border border-purple-200 px-2 py-1 rounded-xl flex items-center justify-between transition group cursor-pointer"
            title="Inspect Utility Types Catalog & Specs"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-purple-700" />
              <span>Catalog (2 Types)</span>
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform text-purple-600">→</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Categories Filter, Search & View Switcher */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Filter Pills With Embedded Type Catalog Triggers */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All Assets</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
                {totalAssets}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('MACHINE')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'MACHINE'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50/60 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Machinery</span>
              <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.MACHINE || 0}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCatalog('MACHINE');
                }}
                title="Open Machinery Types Catalog"
                className="ml-0.5 text-[9px] bg-white/30 hover:bg-white/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Catalog</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('TABLE')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'TABLE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Work Tables</span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.TABLE || 0}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCatalog('TABLE');
                }}
                title="Open Table Types Catalog"
                className="ml-0.5 text-[9px] bg-white/30 hover:bg-white/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Catalog</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('CHAIR')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'CHAIR'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-teal-50/60 text-teal-800 border-teal-200 hover:bg-teal-100'
              }`}
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Chairs</span>
              <span className="text-[10px] bg-teal-200/60 text-teal-900 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.CHAIR || 0}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCatalog('CHAIR');
                }}
                title="Open Chair Types Catalog"
                className="ml-0.5 text-[9px] bg-white/30 hover:bg-white/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Catalog</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('LIGHT')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'LIGHT'
                  ? 'bg-yellow-600 text-white border-yellow-600 shadow-xs'
                  : 'bg-yellow-50/60 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Lighting</span>
              <span className="text-[10px] bg-yellow-200/60 text-yellow-900 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.LIGHT || 0}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCatalog('LIGHT');
                }}
                title="Open Lighting Types Catalog"
                className="ml-0.5 text-[9px] bg-white/30 hover:bg-white/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Catalog</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('FAN')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'FAN'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : 'bg-cyan-50/60 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
              }`}
            >
              <Fan className="w-3.5 h-3.5" />
              <span>Fans</span>
              <span className="text-[10px] bg-cyan-200/60 text-cyan-900 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.FAN || 0}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCatalog('FAN');
                }}
                title="Open Fan Types Catalog"
                className="ml-0.5 text-[9px] bg-white/30 hover:bg-white/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Catalog</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('UTILITY')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'UTILITY'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50/60 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Utilities</span>
              <span className="text-[10px] bg-purple-200/60 text-purple-900 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.UTILITY || 0}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCatalog('UTILITY');
                }}
                title="Open Utility Types Catalog"
                className="ml-0.5 text-[9px] bg-white/30 hover:bg-white/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition"
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Catalog</span>
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('LINES')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'LINES'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Line Distribution View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('WORKSTATIONS')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'WORKSTATIONS'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Workstation Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Line Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Model, Station, Specs, Operator..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Line:</span>
            </div>
            <select
              value={selectedLineFilter}
              onChange={(e) => setSelectedLineFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Lines & Zones (6)</option>
              <option value="Line 01">Line 01 (Polo Shirt & Knit)</option>
              <option value="Line 02">Line 02 (Basic T-Shirt)</option>
              <option value="Line 03">Line 03 (Woven Shirts)</option>
              <option value="Line 04">Line 04 (Denim Heavy)</option>
              <option value="Buffer Workshop">Buffer Workshop (Standby)</option>
              <option value="Scrap Bay">Scrap Bay (Salvage)</option>
            </select>

            <div className="text-xs font-semibold text-slate-500 pl-2">
              Showing <strong className="text-indigo-600">{filteredAssets.length}</strong> items
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE A: 6 Line Distribution Grid */}
      {viewMode === 'LINES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {floorLines
            .filter((l) => selectedLineFilter === 'ALL' || l.name === selectedLineFilter)
            .map((line) => {
              const lineAssets = filteredAssets.filter((m) => m.currentLine === line.name);
              const lineDownCount = lineAssets.filter((m) => m.status === 'BREAKDOWN').length;

              return (
                <div
                  key={line.name}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Line Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
                            {line.name}
                          </h4>
                          {lineDownCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              {lineDownCount} Faulty
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">{line.desc}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                        {lineAssets.length} Assets
                      </span>
                    </div>

                    {/* Staged Assets List */}
                    <div className="space-y-2.5 mt-3 max-h-96 overflow-y-auto pr-1">
                      {lineAssets.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-6 text-center">
                          No matching assets staged in this zone.
                        </p>
                      ) : (
                        lineAssets.map((m) => {
                          const meta = getCategoryMeta(m.category);
                          const IconComp = meta.icon;

                          const isDown = m.status === 'BREAKDOWN';
                          const isBuffer = m.status === 'BUFFER';
                          const isScrap = m.status === 'SCRAP';

                          const dotColor = isDown
                            ? 'bg-rose-500 animate-ping'
                            : isBuffer
                            ? 'bg-amber-500'
                            : isScrap
                            ? 'bg-slate-400'
                            : 'bg-emerald-500';

                          const badgeClass = isDown
                            ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                            : isBuffer
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : isScrap
                            ? 'bg-slate-100 border-slate-300 text-slate-600'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold';

                          return (
                            <div
                              key={m.id}
                              className={`bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200 rounded-xl p-3 text-xs transition space-y-1.5 ${meta.cardBorder}`}
                            >
                              {/* Top Bar: Icon + ID + Status */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5">
                                  <span
                                    className={`w-5 h-5 rounded-lg flex items-center justify-center border text-[11px] ${meta.color}`}
                                    title={meta.label}
                                  >
                                    <IconComp className="w-3 h-3" />
                                  </span>
                                  <span className="font-mono font-bold text-slate-900">{m.id}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}>
                                    {m.status}
                                  </span>
                                </div>
                              </div>

                              {/* Asset Title & Category */}
                              <div>
                                <div className="text-[11px] font-semibold text-slate-800 truncate">
                                  {m.name || `${m.brand} ${m.model}`}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <span>{meta.label}</span>
                                  <span>•</span>
                                  <span>{m.brand}</span>
                                </div>
                              </div>

                              {/* Specs snippet if available */}
                              {m.specs && (
                                <div className="text-[10px] text-slate-500 bg-white/70 px-2 py-1 rounded border border-slate-200/60 truncate">
                                  {m.specs}
                                </div>
                              )}

                              {/* Footer Details & Manage Button */}
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                                <span className="font-semibold text-indigo-700 bg-indigo-50/60 px-1.5 py-0.5 rounded">
                                  {m.stationNo}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCatalog(m.category || 'MACHINE', m.type)}
                                    className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2 py-0.5 rounded-lg border border-indigo-200 flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                    title="Inspect technical specifications, SOP, and checklists for this asset type"
                                  >
                                    <BookOpen className="w-3 h-3 text-indigo-600" />
                                    <span>Specs / Catalog</span>
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-mono text-slate-400">${m.cost || 0}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMove(m.id)}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 transition cursor-pointer"
                                  >
                                    <span>Manage</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW MODE B: Workstation Setup Matrix (Station-by-Station Bird's Eye View) */}
      {viewMode === 'WORKSTATIONS' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-300" />
                <span>Garment Line Workstation Bundles Matrix</span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Displays the complete physical workstation setup (Work Table + Sewing Machine + Chair + Task Light + Fan) at each line station.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-xl border border-white/20">
              {workstationMatrix.length} Staged Stations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workstationMatrix.map((ws, index) => {
              const hasBreakdown =
                ws.table?.status === 'BREAKDOWN' ||
                ws.machine?.status === 'BREAKDOWN' ||
                ws.chair?.status === 'BREAKDOWN' ||
                ws.light?.status === 'BREAKDOWN' ||
                ws.fan?.status === 'BREAKDOWN';

              return (
                <div
                  key={`${ws.line}-${ws.station}-${index}`}
                  className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition ${
                    hasBreakdown
                      ? 'border-rose-300 ring-2 ring-rose-300/60 bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Station Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{ws.station}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {ws.line}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ws.machine?.operator ? `Operator: ${ws.machine.operator}` : 'Workstation Setup'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        hasBreakdown
                          ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {hasBreakdown ? 'Defect Alert' : 'Fully Operational'}
                    </span>
                  </div>

                  {/* Component Slots Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* 1. Work Table Slot */}
                    <div
                      onClick={() => ws.table && handleOpenMove(ws.table.id)}
                      className={`p-2 rounded-xl border transition flex flex-col justify-between ${
                        ws.table
                          ? ws.table.status === 'BREAKDOWN'
                            ? 'bg-rose-50 border-rose-300 cursor-pointer'
                            : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 cursor-pointer'
                          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-800">
                        <span className="flex items-center gap-1">
                          <LayoutGrid className="w-3 h-3 text-amber-600" />
                          <span>Table</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCatalog('TABLE', ws.table?.type);
                            }}
                            className="text-[9px] text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-1 py-0.2 rounded flex items-center gap-0.5 transition cursor-pointer"
                            title="Table Type Catalog"
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>Catalog</span>
                          </button>
                          {ws.table && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ws.table.status === 'BREAKDOWN' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 truncate text-[11px] mt-1">
                        {ws.table ? ws.table.id : 'Unassigned'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {ws.table ? `${ws.table.brand} Table` : 'Standard Line Stand'}
                      </div>
                    </div>

                    {/* 2. Machine Slot */}
                    <div
                      onClick={() => ws.machine && handleOpenMove(ws.machine.id)}
                      className={`p-2 rounded-xl border transition flex flex-col justify-between ${
                        ws.machine
                          ? ws.machine.status === 'BREAKDOWN'
                            ? 'bg-rose-50 border-rose-300 cursor-pointer'
                            : 'bg-indigo-50/50 border-indigo-200/80 hover:bg-indigo-50 cursor-pointer'
                          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-800">
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-indigo-600" />
                          <span>Machinery</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCatalog('MACHINE', ws.machine?.type);
                            }}
                            className="text-[9px] text-indigo-800 hover:text-indigo-950 bg-indigo-100 hover:bg-indigo-200 px-1 py-0.2 rounded flex items-center gap-0.5 transition cursor-pointer"
                            title="Machine Type Catalog"
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>Catalog</span>
                          </button>
                          {ws.machine && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ws.machine.status === 'BREAKDOWN' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 truncate text-[11px] mt-1">
                        {ws.machine ? ws.machine.id : 'No Machine'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {ws.machine ? `${ws.machine.brand} • ${ws.machine.type}` : 'Buffer Stage'}
                      </div>
                    </div>

                    {/* 3. Chair Slot */}
                    <div
                      onClick={() => ws.chair && handleOpenMove(ws.chair.id)}
                      className={`p-2 rounded-xl border transition flex flex-col justify-between ${
                        ws.chair
                          ? ws.chair.status === 'BREAKDOWN'
                            ? 'bg-rose-50 border-rose-300 cursor-pointer'
                            : 'bg-teal-50/50 border-teal-200/80 hover:bg-teal-50 cursor-pointer'
                          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-teal-800">
                        <span className="flex items-center gap-1">
                          <Armchair className="w-3 h-3 text-teal-600" />
                          <span>Seating</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCatalog('CHAIR', ws.chair?.type);
                            }}
                            className="text-[9px] text-teal-800 hover:text-teal-950 bg-teal-100 hover:bg-teal-200 px-1 py-0.2 rounded flex items-center gap-0.5 transition cursor-pointer"
                            title="Chair Type Catalog"
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>Catalog</span>
                          </button>
                          {ws.chair && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ws.chair.status === 'BREAKDOWN' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 truncate text-[11px] mt-1">
                        {ws.chair ? ws.chair.id : 'Unassigned'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {ws.chair ? ws.chair.model : 'Floor Stool'}
                      </div>
                    </div>

                    {/* 4. Light Slot */}
                    <div
                      onClick={() => ws.light && handleOpenMove(ws.light.id)}
                      className={`p-2 rounded-xl border transition flex flex-col justify-between ${
                        ws.light
                          ? ws.light.status === 'BREAKDOWN'
                            ? 'bg-rose-50 border-rose-300 cursor-pointer'
                            : 'bg-yellow-50/50 border-yellow-200/80 hover:bg-yellow-50 cursor-pointer'
                          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-yellow-800">
                        <span className="flex items-center gap-1">
                          <Lightbulb className="w-3 h-3 text-yellow-600" />
                          <span>Lighting</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCatalog('LIGHT', ws.light?.type);
                            }}
                            className="text-[9px] text-yellow-800 hover:text-yellow-950 bg-yellow-100 hover:bg-yellow-200 px-1 py-0.2 rounded flex items-center gap-0.5 transition cursor-pointer"
                            title="Lighting Type Catalog"
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>Catalog</span>
                          </button>
                          {ws.light && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ws.light.status === 'BREAKDOWN' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 truncate text-[11px] mt-1">
                        {ws.light ? ws.light.id : 'Shared High-Bay'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {ws.light ? ws.light.brand : 'Line Illumination'}
                      </div>
                    </div>
                  </div>

                  {/* Fan or Utility Accessory bar */}
                  {ws.fan && (
                    <div
                      onClick={() => handleOpenMove(ws.fan!.id)}
                      className="bg-cyan-50/60 hover:bg-cyan-100/70 border border-cyan-200 p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Fan className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="font-bold text-cyan-900 text-[11px]">{ws.fan.id}</span>
                        <span className="text-[10px] text-cyan-700 truncate">{ws.fan.specs}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCatalog('FAN', ws.fan?.type);
                          }}
                          className="text-[9px] text-cyan-800 hover:text-cyan-950 bg-cyan-100 hover:bg-cyan-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition cursor-pointer"
                          title="Fan Type Catalog"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>Catalog</span>
                        </button>
                        <span className="text-[10px] font-semibold text-cyan-800">Vent</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Relocate / Report Modal */}
      <ScanModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        preselectedMachineId={targetMoveMachineId}
      />

      {/* Interactive Asset Type Catalog Modal */}
      <AssetTypeCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        initialCategory={catalogCategory}
        initialTypeId={catalogTypeId}
        machines={machines}
      />

      {/* Add New Factory Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Register Factory Asset</h3>
                  <p className="text-[11px] text-indigo-300">Add tables, chairs, machinery, lights, or fans to floor grid</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssetSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Asset Category *
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                  {[
                    { id: 'TABLE', label: 'Work Table', icon: LayoutGrid },
                    { id: 'CHAIR', label: 'Chair / Seat', icon: Armchair },
                    { id: 'MACHINE', label: 'Machinery', icon: Wrench },
                    { id: 'LIGHT', label: 'Lighting', icon: Lightbulb },
                    { id: 'FAN', label: 'Fan / Vent', icon: Fan },
                    { id: 'UTILITY', label: 'Plant Utility', icon: Flame },
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChangeInForm(cat.id as AssetCategory)}
                        className={`p-2 rounded-xl border transition flex items-center gap-1.5 justify-center ${
                          newCategory === cat.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ID & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Asset Tag ID *
                  </label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800"
                    placeholder="e.g. TBL-CUT-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Manufacturer / Brand *
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    placeholder="e.g. Featherlite, Juki, Philips"
                  />
                </div>
              </div>

              {/* Asset Name / Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Model / Description *
                </label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  placeholder="e.g. StitchDesk-Pro or Optima-Sew360"
                />
              </div>

              {/* Line & Station Assignment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Floor Line Assignment *
                  </label>
                  <select
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value as FloorLine)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="Line 01">Line 01 (Knit / Polo)</option>
                    <option value="Line 02">Line 02 (T-Shirt Assembly)</option>
                    <option value="Line 03">Line 03 (Woven Shirts)</option>
                    <option value="Line 04">Line 04 (Denim Heavy)</option>
                    <option value="Buffer Workshop">Buffer Workshop</option>
                    <option value="Scrap Bay">Scrap Bay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Station Number / Location *
                  </label>
                  <input
                    type="text"
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    placeholder="e.g. Station 04, Cutting Bay"
                  />
                </div>
              </div>

              {/* Valuation & Technical Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Capital Cost ($ USD)
                  </label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Initial Staging Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as MachineStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE (Operational)</option>
                    <option value="BUFFER">BUFFER (Ready Standby)</option>
                    <option value="BREAKDOWN">BREAKDOWN (Needs Repair)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Specifications & Material Attributes
                </label>
                <textarea
                  value={newSpecs}
                  onChange={(e) => setNewSpecs(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  placeholder="e.g. Anti-vibration rubber feet, 360° pneumatic gas lift, 18,000 lm daylight"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
