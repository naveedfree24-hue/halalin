/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ADDITIVES_DATABASE } from '../data/additivesDb';
import { Additive } from '../types/halal';
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Info, ChevronRight, ChevronDown } from 'lucide-react';

export const ENumberExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HALAL' | 'SOURCE_DEPENDENT' | 'NOT_HALAL'>('ALL');
  const [selectedAdditive, setSelectedAdditive] = useState<Additive | null>(ADDITIVES_DATABASE[1]); // Default E471
  const [showScientific, setShowScientific] = useState(false);

  const filteredAdditives = ADDITIVES_DATABASE.filter((item) => {
    const matchesSearch =
      item.eNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'HALAL') {
      return item.halalStatus === 'HALAL' || item.halalStatus === 'PLANT_BASED' || item.halalStatus === 'SYNTHETIC_MINERAL';
    }
    if (statusFilter === 'SOURCE_DEPENDENT') {
      return item.halalStatus === 'SOURCE_DEPENDENT' || item.halalStatus === 'MASHBOOH';
    }
    if (statusFilter === 'NOT_HALAL') {
      return item.halalStatus === 'NOT_HALAL' || item.halalStatus === 'PORK_DERIVED';
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              European E-Number & Additives Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Biochemical origin analysis, pork risk assessment, and Halal jurisprudence standards for EU additives.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search E-number (e.g. E471, E120)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filter Tabs (Functional segmented controls per frontend_design guidelines) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 max-w-lg">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            statusFilter === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Additives
        </button>
        <button
          onClick={() => setStatusFilter('HALAL')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            statusFilter === 'HALAL'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Plant / Halal
        </button>
        <button
          onClick={() => setStatusFilter('SOURCE_DEPENDENT')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            statusFilter === 'SOURCE_DEPENDENT'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Source Dependent
        </button>
        <button
          onClick={() => setStatusFilter('NOT_HALAL')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            statusFilter === 'NOT_HALAL'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Prohibited / Insects
        </button>
      </div>

      {/* Two-Column Explorer Layout (Desktop Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Additives List (5 columns) */}
        <div className="lg:col-span-5 space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {filteredAdditives.map((item) => {
            const isSelected = selectedAdditive?.eNumber === item.eNumber;
            const isProhibited = item.halalStatus === 'NOT_HALAL' || item.halalStatus === 'PORK_DERIVED';
            const isAmbiguous = item.halalStatus === 'SOURCE_DEPENDENT' || item.halalStatus === 'MASHBOOH';

            return (
              <div
                key={item.eNumber}
                onClick={() => setSelectedAdditive(item)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-850 border-emerald-500 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm tracking-wide">
                      {item.eNumber}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.function}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isProhibited
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : isAmbiguous
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isProhibited ? 'Prohibited' : isAmbiguous ? 'Verify' : 'Halal'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}

          {filteredAdditives.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              No matching E-numbers found. Try searching for "E471" or "E120".
            </div>
          )}
        </div>

        {/* Right Column: Deep Additive Intelligence Detail Panel (7 columns) */}
        <div className="lg:col-span-7">
          {selectedAdditive ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mb-1">
                    <span>E-NUMBER {selectedAdditive.eNumber}</span>
                    {selectedAdditive.insNumber && (
                      <span>· INS {selectedAdditive.insNumber}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white">
                    {selectedAdditive.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Function: {selectedAdditive.function}
                  </p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-xl font-bold uppercase tracking-wider ${
                    selectedAdditive.halalStatus === 'NOT_HALAL' || selectedAdditive.halalStatus === 'PORK_DERIVED'
                      ? 'bg-rose-950 border border-rose-600 text-rose-300'
                      : selectedAdditive.halalStatus === 'SOURCE_DEPENDENT' || selectedAdditive.halalStatus === 'MASHBOOH'
                      ? 'bg-amber-950 border border-amber-600 text-amber-300'
                      : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                  }`}
                >
                  {selectedAdditive.halalStatus === 'SOURCE_DEPENDENT'
                    ? 'Source Dependent'
                    : selectedAdditive.halalStatus === 'NOT_HALAL'
                    ? 'Prohibited'
                    : 'Halal Compatible'}
                </span>
              </div>

              {/* Pork Risk Breakdown Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Pork / Porcine Possibility:</span>
                  <span
                    className={
                      selectedAdditive.porkOriginPossible ? 'text-amber-400' : 'text-emerald-400'
                    }
                  >
                    {selectedAdditive.porkOriginPossible
                      ? '⚠️ Cannot be excluded from code alone'
                      : '✓ No pork origin expected'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Animal Origin Possibility:</span>
                  <span className={selectedAdditive.animalOriginPossible ? 'text-amber-400' : 'text-emerald-400'}>
                    {selectedAdditive.animalOriginPossible ? 'Possible (Tallow, Lard, or Insects)' : 'None (100% Plant / Mineral)'}
                  </span>
                </div>
              </div>

              {/* Plain-Language Explanation */}
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-1.5">
                  Why Might It Matter?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                  {selectedAdditive.reason}
                </p>
              </div>

              {/* Recommendation */}
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-1.5">
                  Halalens Recommendation
                </h3>
                <p className="text-xs text-emerald-300 leading-relaxed bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-900/40">
                  {selectedAdditive.recommendation}
                </p>
              </div>

              {/* Commonly Found In */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Common Products Containing {selectedAdditive.eNumber}:
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAdditive.commonIn.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scientific Details Accordion */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowScientific(!showScientific)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    Biochemical Sourcing & Chemical Structure
                  </span>
                  {showScientific ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {showScientific && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
                    {selectedAdditive.scientificDetails}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 rounded-3xl border border-slate-800">
              Select an additive from the list to view its complete Halal intelligence profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
