'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Wrench,
  LayoutGrid,
  Armchair,
  Lightbulb,
  Fan,
  Flame,
  Search,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  MapPin,
  Tag,
  DollarSign,
  Clock,
  UserCheck,
  ArrowRightLeft,
  AlertOctagon,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Machine, FloorLine, AssetCategory, MachineStatus, RepairUrgency } from '@/types/cmms';
import { createBreakdownTicket, relocateMachine, updateMachineStatus } from '@/lib/services/cmmsService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Machine | null;
  allAssets: Machine[];
  initialCategory?: AssetCategory;
}

interface CategoryStyle {
  label: string;
  plural: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
  border: string;
  dot: string;
  activeBtn: string;
}

export function getCategoryStyle(category?: AssetCategory): CategoryStyle {
  switch (category) {
    case 'TABLE':
      return {
        label: 'Work Table',
        plural: 'Work Tables',
        icon: LayoutGrid,
        color: 'text-amber-800 bg-amber-50',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        activeBtn: 'bg-amber-600 text-white shadow-xs',
      };
    case 'CHAIR':
      return {
        label: 'Ergonomic Chair',
        plural: 'Chairs & Seating',
        icon: Armchair,
        color: 'text-teal-800 bg-teal-50',
        badge: 'bg-teal-100 text-teal-800 border-teal-300',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
        activeBtn: 'bg-teal-600 text-white shadow-xs',
      };
    case 'LIGHT':
      return {
        label: 'Lighting Fixture',
        plural: 'Lighting Fixtures',
        icon: Lightbulb,
        color: 'text-yellow-800 bg-yellow-50',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        border: 'border-yellow-200',
        dot: 'bg-yellow-500',
        activeBtn: 'bg-yellow-600 text-white shadow-xs',
      };
    case 'FAN':
      return {
        label: 'Ventilation Fan',
        plural: 'Fans & Air Flow',
        icon: Fan,
        color: 'text-cyan-800 bg-cyan-50',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        border: 'border-cyan-200',
        dot: 'bg-cyan-500',
        activeBtn: 'bg-cyan-600 text-white shadow-xs',
      };
    case 'UTILITY':
      return {
        label: 'Plant Utility',
        plural: 'Utilities & Plant',
        icon: Flame,
        color: 'text-purple-800 bg-purple-50',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
        activeBtn: 'bg-purple-600 text-white shadow-xs',
      };
    case 'MACHINE':
    default:
      return {
        label: 'Sewing Machine',
        plural: 'Machinery',
        icon: Wrench,
        color: 'text-indigo-800 bg-indigo-50',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
        activeBtn: 'bg-indigo-600 text-white shadow-xs',
      };
  }
}

// Generate category engineering specs for any asset
function getAssetCategorySpecs(asset: Machine): Record<string, string> {
  const cat = asset.category || 'MACHINE';
  switch (cat) {
    case 'TABLE':
      return {
        'Dimensions': '120 cm x 60 cm x 75 cm (Adjustable)',
        'Bed Surface': 'Micro-pressure laminate with metric measurement rule',
        'Frame Construction': 'Heavy-gauge tubular steel with anti-vibration foot pads',
        'Load Rating': '250 kg distributed working weight',
        'Drawer Unit': 'Lockable steel slide drawer for tools and shears',
        'Air Flotation Option': asset.model?.includes('Air') || asset.specs?.includes('Air') ? 'Integrated blower bed with perforated stainless nozzle' : 'Passive high-glide laminate',
      };
    case 'CHAIR':
      return {
        'Height Adjustment': 'Class 4 Pneumatic gas-lift cylinder (42 cm to 56 cm)',
        'Lumbar Support': 'Ergonomic contour with height & tilt lock mechanism',
        'Seat Cushion': 'High-density molded polyurethane foam (55 kg/m³)',
        'Casters & Base': '5-star reinforced nylon base with twin-wheel friction casters',
        'Swivel Range': '360° continuous rotation with ball-bearing hub',
        'Ergonomic Compliance': 'EN 1335-1 / OSHA Apparel Floor Ergonomics Standard',
      };
    case 'LIGHT':
      return {
        'Luminous Output': '18,000 Lumens (High-Bay) / 850 Lumens (Needle Task)',
        'Illuminance Target': '1,200 Lux directly at operator needle plate',
        'Color Temperature': '6500K Cool Daylight (Inspection grade)',
        'Color Rendering Index': 'CRI > 90 Ra (Garment shade & dye matching)',
        'Ingress Protection': 'IP65 dust-tight & moisture protected housing',
        'Optics / Diffuser': 'Micro-prismatic anti-glare polycarbonate optical lens',
      };
    case 'FAN':
      return {
        'Blade Span / Sweep': '56 inches (1400 mm) Aerodynamic aluminum blades',
        'Air Delivery Rating': '270 m³/min (9,500 CFM high velocity airflow)',
        'Motor Specification': 'Double ball bearing 100% copper wound 75W motor',
        'Speed Regulation': '5-step electronic micro-stepped line regulator',
        'Operating Velocity': '320 RPM peak at maximum speed',
        'Safety Feature': 'Secondary fall-prevention braided steel safety tether',
      };
    case 'UTILITY':
      return {
        'Working Pressure': '4.5 to 7.0 Bar (65 to 100 PSI regulated)',
        'Output Capacity': 'Central steam dry vapor generation / 45 CFM compressed air',
        'Safety Relief': 'Dual ASME-certified pop-off pressure safety relief valves',
        'Power Supply': '415V 3-Phase 50Hz industrial feed',
        'Water Treatment': 'Integrated cation ion-exchange water softening bed',
        'Shutoff Control': 'Quarter-turn emergency isolation ball valve with lockout tag',
      };
    case 'MACHINE':
    default:
      return {
        'Max Sewing Speed': '5,000 RPM (High-speed precision seaming)',
        'Motor System': 'Direct-drive integrated servo motor (550W energy saving)',
        'Needle System': 'DBx1 / 16x231 (#09 to #18 fabric gauge)',
        'Stitch Length': '0 to 5.0 mm micrometric rotary dial adjustment',
        'Automatic Features': 'Under-bed thread trimmer (UTT), auto wiper, backtack',
        'Lubrication': 'Fully sealed force-feed impeller oil circulation with sight glass',
      };
  }
}

function getCategorySOP(category?: AssetCategory): string[] {
  switch (category) {
    case 'TABLE':
      return [
        'Keep table surface completely free of loose sewing needles, shears, and pins before starting work.',
        'Wipe the laminated cutting surface daily using approved anti-static microfiber cloth.',
        'Ensure table levelers are securely locked to the concrete floor to prevent operational vibration.',
      ];
    case 'CHAIR':
      return [
        'Adjust the pneumatic chair height so your knees form a 90° angle with feet flat on the floor or treadle.',
        'Always set lumbar support firmly against the lower back before beginning extended sewing shifts.',
        'Never stand on swivel chairs or use them as a stepping ladder to retrieve garment rolls.',
      ];
    case 'LIGHT':
      return [
        'Inspect task light gooseneck position to illuminate needle plate without casting shadows or glare.',
        'Keep optical diffuser clean and free from lint buildup to sustain 1,000+ Lux illumination standard.',
        'Report any light flicker or ballast hum immediately to prevent technician eye strain and headache.',
      ];
    case 'FAN':
      return [
        'Ensure minimum overhead ceiling clearance of 2.7 meters above sewing operator floor level.',
        'Turn off fan before cleaning blades to avoid motor imbalance or mechanical obstruction.',
        'Verify that the secondary safety drop-cable is anchored to the structural plant truss.',
      ];
    case 'UTILITY':
      return [
        'Perform daily morning boiler sludge blowdown before opening steam main valve to the iron line.',
        'Inspect air compressor pressure gauge sight glasses and verify condensate auto-drain functions.',
        'Never tamper with or override ASME certified pressure relief safety valves.',
      ];
    case 'MACHINE':
    default:
      return [
        'Perform 5-point safety check before power-up: needle guard, finger shield, and belt cover in place.',
        'Check oil level in sight glass window; never run machine dry or with contaminated lubrication oil.',
        'Always allow the feed dog to advance the fabric naturally; never force or pull fabric through seamer.',
      ];
  }
}

function getCategoryChecklist(category?: AssetCategory): string[] {
  switch (category) {
    case 'TABLE':
      return [
        'Daily: Inspect surface for scratches, chips, or rough burrs that could snag delicate knit fabrics.',
        'Weekly: Check frame bolt tightness and inspect caster wheel locks on movable inspection beds.',
        'Monthly: Calibrate levelness using spirit level; vacuum lint buildup under table drawer slides.',
      ];
    case 'CHAIR':
      return [
        'Daily: Check pneumatic gas lift height retention under operator load.',
        'Weekly: Remove thread fluff and lint tangled in 5-star swivel wheel casters.',
        'Monthly: Tighten backrest bracket screws; inspect molded foam seat integrity.',
      ];
    case 'LIGHT':
      return [
        'Daily: Visual check of LED light output and task gooseneck fixture stability.',
        'Weekly: Wipe exterior diffuser with dry microfiber cloth to remove cotton fly.',
        'Monthly: Perform Lux meter audit on workstation needle plate (Target: 1,000 to 1,200 Lux).',
      ];
    case 'FAN':
      return [
        'Daily: Observe smooth rotation with no bearing wobble, rattle, or vibration.',
        'Weekly: Wipe fan blades to remove accumulated garment dust and maintain dynamic balance.',
        'Monthly: Inspect regulator switch box, capacitor, and secondary steel safety tether tension.',
      ];
    case 'UTILITY':
      return [
        'Daily: Check steam operating pressure (4.5 to 6.0 Bar) and water level sight tube.',
        'Weekly: Manual pop-test of pressure safety relief valve to prevent valve seat seizure.',
        'Monthly: Replace compressed air intake filter cartridge; inspect plant steam pipe lagging.',
      ];
    case 'MACHINE':
    default:
      return [
        'Daily: Check oil level sight glass before turning on main circuit breaker.',
        'Daily: Remove needle plate and clean thread fluff / lint from feed dog teeth.',
        'Weekly: Inspect rotary hook point for needle scratches, burrs, or thread jams.',
        'Monthly: Verify auto-trimmer blade sharpness and check belt/servo drive alignment.',
      ];
  }
}

export function AssetModal({
  isOpen,
  onClose,
  asset,
  allAssets,
  initialCategory = 'MACHINE',
}: AssetModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<AssetCategory>(
    asset?.category || initialCategory
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    asset?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'REPORT' | 'RELOCATE'>('DETAILS');
  const [searchQuery, setSearchQuery] = useState('');

  // Breakdown Ticket Form
  const [faultType, setFaultType] = useState<string>('Mechanical Malfunction / Operational Fault');
  const [urgency, setUrgency] = useState<RepairUrgency>('CRITICAL');
  const [faultNotes, setFaultNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Relocate Form
  const [targetLine, setTargetLine] = useState<FloorLine>('Line 01');
  const [targetStation, setTargetStation] = useState<string>('Station 01');
  const [relocateReason, setRelocateReason] = useState<string>('');

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      if (asset) {
        setSelectedAssetId(asset.id);
        setActiveCategory(asset.category || 'MACHINE');
      } else {
        const cat = initialCategory || 'MACHINE';
        setActiveCategory(cat);
        const match = allAssets.find((m) => m.category === cat);
        if (match) setSelectedAssetId(match.id);
      }
      setActiveTab('DETAILS');
    }
  }, [isOpen, asset, initialCategory, allAssets]);

  // Assets in current active category
  const categoryAssets = useMemo(() => {
    return allAssets.filter((m) => (m.category || 'MACHINE') === activeCategory);
  }, [allAssets, activeCategory]);

  // Filtered by search if any
  const filteredCategoryAssets = useMemo(() => {
    if (!searchQuery.trim()) return categoryAssets;
    const q = searchQuery.toLowerCase();
    return categoryAssets.filter((m) =>
      m.id.toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.brand || '').toLowerCase().includes(q) ||
      (m.stationNo || '').toLowerCase().includes(q) ||
      (m.currentLine || '').toLowerCase().includes(q)
    );
  }, [categoryAssets, searchQuery]);

  // Active Asset
  const currentAsset: Machine | undefined = useMemo(() => {
    return (
      allAssets.find((m) => m.id === selectedAssetId) ||
      categoryAssets[0] ||
      asset ||
      allAssets[0]
    );
  }, [allAssets, selectedAssetId, categoryAssets, asset]);

  if (!isOpen || !currentAsset) return null;

  const currentCat = currentAsset.category || activeCategory || 'MACHINE';
  const catStyle = getCategoryStyle(currentCat);
  const CatIcon = catStyle.icon;

  const specs = getAssetCategorySpecs(currentAsset);
  const sop = getCategorySOP(currentCat);
  const checklist = getCategoryChecklist(currentCat);

  // Status Helpers
  const isDown = currentAsset.status === 'BREAKDOWN';
  const isBuffer = currentAsset.status === 'BUFFER';
  const isScrap = currentAsset.status === 'SCRAP';

  const dotColor = isDown
    ? 'bg-rose-500 animate-ping'
    : isBuffer
    ? 'bg-amber-500'
    : isScrap
    ? 'bg-slate-400'
    : 'bg-emerald-500';

  const statusBadge = isDown
    ? 'bg-rose-100 text-rose-800 border-rose-300'
    : isBuffer
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : isScrap
    ? 'bg-slate-100 text-slate-700 border-slate-300'
    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  // Handle Quick Status Change
  const handleQuickStatus = async (newStatus: MachineStatus) => {
    try {
      await updateMachineStatus(currentAsset.id, newStatus);
      showToast(`${currentAsset.id} marked as ${newStatus}!`, 'success');
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  // Submit Breakdown Ticket
  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ticketId = await createBreakdownTicket({
        machineId: currentAsset.id,
        machineType: currentAsset.typeName || currentAsset.type || currentCat,
        line: currentAsset.currentLine,
        reportedAt: new Date().toISOString(),
        reportedBy: `${user?.name || 'Supervisor'} (${user?.title || 'Floor'})`,
        faultCategory: faultType,
        faultDetails: faultNotes.trim() || `Reported from Asset Inspection Popup.`,
        urgency,
      });

      showToast(
        `Critical breakdown #${ticketId} dispatched for ${currentAsset.id} on ${currentAsset.currentLine}!`,
        'error'
      );
      setFaultNotes('');
      setActiveTab('DETAILS');
    } catch (err) {
      showToast('Failed to dispatch ticket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Relocation
  const handleRelocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await relocateMachine(
        currentAsset.id,
        targetLine,
        targetStation,
        relocateReason.trim() || 'Floor line rebalancing',
        user?.name || 'Supervisor'
      );
      showToast(
        `Asset ${currentAsset.id} relocated to ${targetLine} (${targetStation})`,
        'success'
      );
      setRelocateReason('');
      setActiveTab('DETAILS');
    } catch (err) {
      showToast('Failed to relocate asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header with Category Badge & Asset Title */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${catStyle.badge}`}
            >
              <CatIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-extrabold text-sm sm:text-base text-white">
                  {currentAsset.id}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${catStyle.badge}`}
                >
                  {catStyle.label}
                </span>
                <div className="flex items-center gap-1.5 ml-1">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${statusBadge}`}>
                    {currentAsset.status}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-300 truncate mt-0.5">
                {currentAsset.name || `${currentAsset.brand} ${currentAsset.model}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-semibold scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('MACHINE');
                const first = allAssets.find((m) => (m.category || 'MACHINE') === 'MACHINE');
                if (first) setSelectedAssetId(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'MACHINE'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Machinery</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('TABLE');
                const first = allAssets.find((m) => m.category === 'TABLE');
                if (first) setSelectedAssetId(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'TABLE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Work Tables</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('CHAIR');
                const first = allAssets.find((m) => m.category === 'CHAIR');
                if (first) setSelectedAssetId(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'CHAIR'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Chairs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('LIGHT');
                const first = allAssets.find((m) => m.category === 'LIGHT');
                if (first) setSelectedAssetId(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'LIGHT'
                  ? 'bg-yellow-600 text-white border-yellow-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Lighting</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('FAN');
                const first = allAssets.find((m) => m.category === 'FAN');
                if (first) setSelectedAssetId(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'FAN'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Fan className="w-3.5 h-3.5" />
              <span>Fans</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory('UTILITY');
                const first = allAssets.find((m) => m.category === 'UTILITY');
                if (first) setSelectedAssetId(first.id);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'UTILITY'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Utilities</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search asset in category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Assets Picker Strip */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {catStyle.plural} ({filteredCategoryAssets.length}):
          </span>
          {filteredCategoryAssets.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No assets found</span>
          ) : (
            filteredCategoryAssets.map((m) => {
              const isSelected = m.id === currentAsset.id;
              const isUnitDown = m.status === 'BREAKDOWN';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedAssetId(m.id);
                    setActiveTab('DETAILS');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isUnitDown ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-mono">{m.id}</span>
                  <span className="text-[10px] opacity-75 truncate max-w-[80px]">
                    {m.brand}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Navigation Tabs (Details / Report / Relocate) */}
        <div className="px-5 pt-3 bg-white border-b border-slate-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('DETAILS')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Specifications & Blueprints</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REPORT')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'REPORT'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-rose-700'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Report Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RELOCATE')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RELOCATE'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-indigo-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Relocate Station</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ASSET SPECIFICATIONS & BLUEPRINTS */}
          {activeTab === 'DETAILS' && (
            <div className="space-y-6">
              {/* Identity & Location Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-600" />
                    <span>Location</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                    {currentAsset.currentLine}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-semibold">{currentAsset.stationNo}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>Assigned Operator</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                    {currentAsset.operator || 'Unassigned'}
                  </div>
                  <div className="text-[10px] text-slate-500">Certified Floor Operator</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-600" />
                    <span>Valuation</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 mt-1 font-mono">
                    ${currentAsset.cost?.toLocaleString() || '0'}
                  </div>
                  <div className="text-[10px] text-slate-500">Asset Capital Cost</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-600" />
                    <span>Service History</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1">
                    {currentAsset.totalDowntimeMinutes || 0} min
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Age: {currentAsset.ageYears ? `${currentAsset.ageYears} yrs` : 'New'}
                  </div>
                </div>
              </div>

              {/* Status Management Bar */}
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-slate-700">Operational Status: </span>
                  <span className={`font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                    {currentAsset.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Status:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickStatus('ACTIVE')}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer"
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatus('BUFFER')}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 transition cursor-pointer"
                  >
                    Buffer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatus('BREAKDOWN')}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 transition cursor-pointer"
                  >
                    Breakdown
                  </button>
                </div>
              </div>

              {/* Category Technical Specifications */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Category Engineering Specifications ({catStyle.label})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(specs).map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <span className="text-slate-500 font-medium">{key}</span>
                      <span className="font-semibold text-slate-900 font-mono text-right max-w-[55%] truncate">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SOP & Maintenance Checklist Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SOP */}
                <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Standard Operating Procedures (SOP)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-950">
                    {sop.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-amber-600 font-bold font-mono text-[11px] shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Checklist */}
                <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Preventive Maintenance Checklist</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {checklist.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('REPORT')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Report Breakdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('RELOCATE')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Relocate Station</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REPORT BREAKDOWN TICKET */}
          {activeTab === 'REPORT' && (
            <form onSubmit={handleReportBreakdown} className="space-y-4">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Dispatch Maintenance Breakdown Ticket</span>
                </div>
                <p>
                  Create an immediate mechanical fault ticket for{' '}
                  <strong className="font-mono">{currentAsset.id}</strong> stationed at{' '}
                  <strong>{currentAsset.currentLine}</strong> ({currentAsset.stationNo}).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CRITICAL', 'WARNING', 'INFO'] as RepairUrgency[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgency(level)}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        urgency === level
                          ? level === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : level === 'WARNING'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fault Category / Symptom
                </label>
                <input
                  type="text"
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Mechanic Fault Notes
                </label>
                <textarea
                  rows={3}
                  value={faultNotes}
                  onChange={(e) => setFaultNotes(e.target.value)}
                  placeholder="Describe exact symptoms, error codes, noise, stitch defect, or component breakage..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('DETAILS')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Ticket'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RELOCATE STATION */}
          {activeTab === 'RELOCATE' && (
            <form onSubmit={handleRelocate} className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-xs text-indigo-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>Floor Line Rebalancing & Relocation</span>
                </div>
                <p>
                  Transfer asset <strong className="font-mono">{currentAsset.id}</strong> from{' '}
                  <strong>{currentAsset.currentLine}</strong> ({currentAsset.stationNo}) to a new zone.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Line / Zone
                  </label>
                  <select
                    value={targetLine}
                    onChange={(e) => setTargetLine(e.target.value as FloorLine)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Line 01">Line 01 (Polo Shirt & Knit)</option>
                    <option value="Line 02">Line 02 (Basic T-Shirt)</option>
                    <option value="Line 03">Line 03 (Woven Shirts)</option>
                    <option value="Line 04">Line 04 (Denim Heavy)</option>
                    <option value="Buffer Workshop">Buffer Workshop (Standby)</option>
                    <option value="Scrap Bay">Scrap Bay (Salvage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Station Number
                  </label>
                  <input
                    type="text"
                    value={targetStation}
                    onChange={(e) => setTargetStation(e.target.value)}
                    placeholder="e.g. Station 04"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relocation Reason
                </label>
                <input
                  type="text"
                  value={relocateReason}
                  onChange={(e) => setRelocateReason(e.target.value)}
                  placeholder="e.g. Production ramp-up, line setup change, mechanic overhaul"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('DETAILS')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isSubmitting ? 'Relocating...' : 'Confirm Relocation'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
