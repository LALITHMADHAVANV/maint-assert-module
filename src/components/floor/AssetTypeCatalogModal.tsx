'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  FileText,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Sparkles,
  MapPin,
  Tag,
} from 'lucide-react';
import { AssetCategory, Machine } from '@/types/cmms';
import { ASSET_TYPES_CATALOG, AssetTypeSpec } from '@/lib/assetTypesData';

interface AssetTypeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: AssetCategory | 'ALL';
  initialTypeId?: string;
  machines?: Machine[];
}

function getCategoryColor(category: AssetCategory) {
  switch (category) {
    case 'MACHINE':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        activeBtn: 'bg-indigo-600 text-white shadow-sm',
        icon: Wrench,
      };
    case 'TABLE':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        activeBtn: 'bg-amber-600 text-white shadow-sm',
        icon: LayoutGrid,
      };
    case 'CHAIR':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        badge: 'bg-teal-100 text-teal-800 border-teal-300',
        activeBtn: 'bg-teal-600 text-white shadow-sm',
        icon: Armchair,
      };
    case 'LIGHT':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        activeBtn: 'bg-yellow-600 text-white shadow-sm',
        icon: Lightbulb,
      };
    case 'FAN':
      return {
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        activeBtn: 'bg-cyan-600 text-white shadow-sm',
        icon: Fan,
      };
    case 'UTILITY':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        activeBtn: 'bg-purple-600 text-white shadow-sm',
        icon: Flame,
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        activeBtn: 'bg-slate-800 text-white shadow-sm',
        icon: Wrench,
      };
  }
}

export function AssetTypeCatalogModal({
  isOpen,
  onClose,
  initialCategory = 'ALL',
  initialTypeId,
  machines = [],
}: AssetTypeCatalogModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>(initialCategory);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    initialTypeId || ASSET_TYPES_CATALOG[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setSelectedCategory(initialCategory);
      }
      if (initialTypeId) {
        setSelectedTypeId(initialTypeId);
      } else {
        // Pick first item matching category if available
        const match =
          initialCategory && initialCategory !== 'ALL'
            ? ASSET_TYPES_CATALOG.find((t) => t.category === initialCategory)
            : ASSET_TYPES_CATALOG[0];
        if (match) setSelectedTypeId(match.id);
      }
    }
  }, [isOpen, initialCategory, initialTypeId]);

  // Filter types based on category & search
  const filteredTypes = useMemo(() => {
    return ASSET_TYPES_CATALOG.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchModels = item.models.some((m) => m.toLowerCase().includes(q));
        const matchParts = item.compatibleParts.some((p) => p.toLowerCase().includes(q));
        return matchName || matchId || matchSubtitle || matchModels || matchParts;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Keep selectedTypeId valid
  useEffect(() => {
    if (filteredTypes.length > 0 && !filteredTypes.some((t) => t.id === selectedTypeId)) {
      setSelectedTypeId(filteredTypes[0].id);
    }
  }, [filteredTypes, selectedTypeId]);

  // Active Type Spec
  const activeSpec: AssetTypeSpec | undefined = useMemo(() => {
    return (
      ASSET_TYPES_CATALOG.find((t) => t.id === selectedTypeId) ||
      filteredTypes[0] ||
      ASSET_TYPES_CATALOG[0]
    );
  }, [selectedTypeId, filteredTypes]);

  // Live deployed units for this type or category
  const deployedUnits = useMemo(() => {
    if (!activeSpec) return [];
    return machines.filter((m) => {
      // Check if machine type matches, or category matches with loose name/model match
      if (m.type === activeSpec.id) return true;
      if (
        m.category === activeSpec.category &&
        ((m.type && m.type.toLowerCase().includes(activeSpec.id.toLowerCase())) ||
          (m.model && activeSpec.models.some((mod) => m.model.toLowerCase().includes(mod.toLowerCase()))))
      ) {
        return true;
      }
      return false;
    });
  }, [machines, activeSpec]);

  if (!isOpen) return null;

  const currentMeta = activeSpec ? getCategoryColor(activeSpec.category) : getCategoryColor('MACHINE');
  const IconHeader = currentMeta.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Asset Type Catalog & Engineering Specifications
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Interactive Directory
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 hidden sm:block">
                Browse official factory equipment blueprints, standard operating procedures, maintenance checklists, and live deployed units.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/asset-types?category=${activeSpec?.category || 'MACHINE'}&type=${activeSpec?.id || ''}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/20 hidden md:flex items-center gap-1.5"
              title="Open full page dedicated view"
            >
              <span>Full Page View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close catalog modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar & Quick Category Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-semibold scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Types ({ASSET_TYPES_CATALOG.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('MACHINE')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'MACHINE'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Machinery</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('TABLE')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'TABLE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tables</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('CHAIR')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'CHAIR'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Chairs</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('LIGHT')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'LIGHT'
                  ? 'bg-yellow-600 text-white border-yellow-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Lighting</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('FAN')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'FAN'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Fan className="w-3.5 h-3.5" />
              <span>Fans</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('UTILITY')}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'UTILITY'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Utilities</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search specs, models, parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Modal Main Body (2 Columns on MD+) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Types Navigation List */}
          <div className="w-full md:w-72 lg:w-80 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto shrink-0 space-y-2 max-h-52 md:max-h-none">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Available Types ({filteredTypes.length})
            </div>

            {filteredTypes.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                No asset types match your filter.
              </div>
            ) : (
              filteredTypes.map((type) => {
                const isSelected = type.id === activeSpec?.id;
                const meta = getCategoryColor(type.category);
                const ItemIcon = meta.icon;

                // Count deployed units on floor for this type
                const countOnFloor = machines.filter(
                  (m) => m.type === type.id || (m.category === type.category && m.type?.includes(type.id))
                ).length;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`w-full text-left p-2.5 rounded-2xl border transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-white border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${
                        isSelected ? meta.badge : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-[11px] text-slate-900 truncate">
                          {type.id}
                        </span>
                        {countOnFloor > 0 ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {countOnFloor} Active
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">Spec Only</span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">{type.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{type.subtitle}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Specification View */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {activeSpec ? (
              <>
                {/* Header of Active Type */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentMeta.badge}`}>
                        {activeSpec.category}
                      </span>
                      <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {activeSpec.id}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Standard Engineering Catalog</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activeSpec.name}</h3>
                    <p className="text-xs text-indigo-700 font-medium">{activeSpec.subtitle}</p>
                  </div>

                  <Link
                    href={`/dashboard/asset-types?category=${activeSpec.category}&type=${activeSpec.id}`}
                    className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Full Spec Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Application Context */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Industrial Application & Line Fitment</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{activeSpec.application}</p>
                </div>

                {/* Approved Models in Factory Inventory */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Approved Factory Brands & Models</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeSpec.models.map((model) => (
                      <span
                        key={model}
                        className="text-xs font-medium bg-white text-slate-800 border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Engineering Specifications Grid */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Technical & Mechanical Blueprints</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(activeSpec.specs).map(([key, val]) => (
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

                {/* SOP & Checklist Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SOP */}
                  <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Standard Operating Procedures (SOP)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-amber-950">
                      {activeSpec.sop.map((step, idx) => (
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
                      {activeSpec.checklist.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Compatible Spare Parts */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Approved Compatible Spare Parts</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeSpec.compatibleParts.map((part) => (
                      <span
                        key={part}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Deployed Units On Factory Floor */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Deployed Units on Factory Floor ({deployedUnits.length})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Real-time floor state</span>
                  </div>

                  {deployedUnits.length === 0 ? (
                    <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      No active units of this type currently deployed on production lines.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {deployedUnits.map((u) => {
                        const isDown = u.status === 'BREAKDOWN';
                        return (
                          <div
                            key={u.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between shadow-xs"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">{u.id}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                    isDown
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {u.currentLine} • {u.stationNo}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">${u.cost || 0}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select an asset type on the left to inspect blueprints and specifications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
