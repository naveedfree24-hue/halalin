/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Activity, Database, CheckCircle2, AlertCircle, Shield, Check, Clock, Server } from 'lucide-react';
import { CommunitySubmission } from '../types/halal';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: CommunitySubmission[];
  onApproveSubmission: (id: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onApproveSubmission,
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'QUEUE' | 'API'>('METRICS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                HALALENS Governance & Data Quality Dashboard
              </h2>
              <p className="text-[11px] text-slate-400">
                Ontology health, specialist review queue, and deterministic engine telemetry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'METRICS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Quality & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors relative ${
              activeTab === 'QUEUE'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expert Review Queue
            {submissions.filter((s) => s.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                {submissions.filter((s) => s.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('API')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'API'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            API Endpoints & Architecture
          </button>
        </div>

        {/* Tab 1: METRICS & DATA QUALITY (Section 85) */}
        {activeTab === 'METRICS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Barcode Match Rate</span>
                <div className="text-xl font-extrabold text-emerald-400 mt-1 tabular-nums">98.4%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">EU/US coverage</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono">OCR Text Accuracy</span>
                <div className="text-xl font-extrabold text-emerald-400 mt-1 tabular-nums">95.1%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Multilingual segmenter</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Canonical Ingredients</span>
                <div className="text-xl font-extrabold text-white mt-1 tabular-nums">1,480+</div>
                <div className="text-[10px] text-slate-400 mt-0.5">8,900+ aliases</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono">E-Number Additives</span>
                <div className="text-xl font-extrabold text-white mt-1 tabular-nums">380</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Full EFSA / EU scope</div>
              </div>
            </div>

            {/* Country Coverage Barometer (Section 86) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Country Database Coverage (Section 86)
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>🇫🇷 France & Belgium (OpenFoodFacts + Retail sync)</span>
                    <span className="font-mono text-emerald-400">96%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[96%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>🇩🇪 Germany & Austria</span>
                    <span className="font-mono text-emerald-400">92%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[92%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>🇬🇧 United Kingdom</span>
                    <span className="font-mono text-emerald-400">95%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[95%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>🇺🇸 United States & Canada</span>
                    <span className="font-mono text-emerald-400">89%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[89%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SPECIALIST REVIEW QUEUE (Section 56) */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Community packaging contributions waiting for specialist verification:
            </p>

            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{sub.productName}</h4>
                    <span className="text-[11px] text-slate-400">
                      {sub.brand} · {sub.country} · {sub.barcode || 'No barcode'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      sub.status === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 font-mono text-[11px] text-slate-300 line-clamp-3">
                  {sub.ingredientsText}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    Contributed by {sub.contributorName} on {new Date(sub.timestamp).toLocaleDateString()}
                  </span>
                  {sub.status !== 'VERIFIED' && (
                    <button
                      onClick={() => onApproveSubmission(sub.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: API ENDPOINTS (Section 45 & 59) */}
        {activeTab === 'API' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">
              HALALENS modular REST API architecture designed for mobile clients, grocery extensions, and retailers:
            </p>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span> /api/products/barcode/:code
                </div>
                <span className="text-slate-500 font-sans text-[10px]">Instant cached EAN/UPC lookup</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">POST</span> /api/analyze-ingredients
                </div>
                <span className="text-slate-500 font-sans text-[10px]">Multilingual ingredient segmentation</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span> /api/additives/:number
                </div>
                <span className="text-slate-500 font-sans text-[10px]">European E-number intelligence</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">POST</span> /api/certifications/verify
                </div>
                <span className="text-slate-500 font-sans text-[10px]">Accreditation authority cross-check</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
