/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, WifiOff, Download, CheckCircle2, HardDrive, ShieldCheck } from 'lucide-react';

interface OfflineModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineModeModal: React.FC<OfflineModeModalProps> = ({ isOpen, onClose }) => {
  const [downloadedPacks, setDownloadedPacks] = useState<Record<string, boolean>>({
    eu_core: true,
    fr_pack: true,
    de_pack: true,
  });

  if (!isOpen) return null;

  const togglePack = (packId: string) => {
    setDownloadedPacks((prev) => ({
      ...prev,
      [packId]: !prev[packId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Offline Ingredient Dictionaries
              </h2>
              <p className="text-[11px] text-slate-400">
                Scan and detect pork derivatives and E-numbers with zero internet
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Offline Engine Active
          </div>
          <p className="text-[11px] text-slate-300">
            All deterministic ingredient classifications, E-numbers, and multilingual pork synonyms run directly on your device inside HALALENS.
          </p>
        </div>

        {/* Dictionary Packs List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-white">European Core Additive & Pork Database</div>
              <div className="text-[11px] text-slate-400">E100–E1520 + 200+ pork synonyms (480 KB)</div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Installed
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-white">French Packaging Dictionary (FR / BE / CH)</div>
              <div className="text-[11px] text-slate-400">Charcuterie, gélatines, arômes (320 KB)</div>
            </div>
            <button
              onClick={() => togglePack('fr_pack')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                downloadedPacks.fr_pack
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {downloadedPacks.fr_pack ? '✓ Installed' : 'Download'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-white">German & Austrian Dictionary (DE / AT)</div>
              <div className="text-[11px] text-slate-400">Schweinederivate & Speisefettsäuren (290 KB)</div>
            </div>
            <button
              onClick={() => togglePack('de_pack')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                downloadedPacks.de_pack
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {downloadedPacks.de_pack ? '✓ Installed' : 'Download'}
            </button>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 italic">
          *Note: Live barcode databases and certificate verification databases still require connectivity for real-time brand records.
        </div>
      </div>
    </div>
  );
};
