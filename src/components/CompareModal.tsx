/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Scale, Check, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { AnalysisResult } from '../types/halal';
import { PRODUCTS_DATABASE } from '../data/productsDb';
import { runHalalAnalysis } from '../engine/classification';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseResult: AnalysisResult;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  baseResult,
}) => {
  const [selectedCandidateCode, setSelectedCandidateCode] = useState<string>(
    PRODUCTS_DATABASE.find((p) => p.ean !== baseResult.product?.ean)?.ean || PRODUCTS_DATABASE[0].ean
  );

  if (!isOpen) return null;

  const candidateProduct = PRODUCTS_DATABASE.find((p) => p.ean === selectedCandidateCode);
  const candidateResult = candidateProduct
    ? runHalalAnalysis(candidateProduct.ingredientsRaw, candidateProduct)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Halal & Dietary Product Comparison
              </h2>
              <p className="text-[11px] text-slate-400">
                Compare pork risk, halal status, certification, and additives side by side
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Chooser */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Compare with:</span>
          <select
            value={selectedCandidateCode}
            onChange={(e) => setSelectedCandidateCode(e.target.value)}
            className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
          >
            {PRODUCTS_DATABASE.filter((p) => p.ean !== baseResult.product?.ean).map((p) => (
              <option key={p.id} value={p.ean}>
                {p.name} ({p.brand} - {p.marketCountry})
              </option>
            ))}
          </select>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* Column A: Base Product */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Product A</span>
              <h3 className="text-sm font-bold text-white truncate">
                {baseResult.product?.name || 'Current Scan'}
              </h3>
              <p className="text-[11px] text-slate-400">{baseResult.product?.brand || 'Scanned Label'}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Pork Status</span>
                <div
                  className={`mt-1 font-bold ${
                    baseResult.porkCheck.status === 'PORK_DETECTED'
                      ? 'text-rose-400'
                      : baseResult.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {baseResult.porkCheck.status === 'PORK_DETECTED'
                    ? '🔴 Pork Detected'
                    : baseResult.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                    ? '🟡 Needs Verification'
                    : '🟢 Pork-Free Declared'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Halal Assessment</span>
                <div
                  className={`mt-1 font-bold ${
                    baseResult.halalAnalysis.status === 'NOT_HALAL' || baseResult.halalAnalysis.status === 'PORK_DERIVED'
                      ? 'text-rose-400'
                      : baseResult.halalAnalysis.status === 'SOURCE_DEPENDENT'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {baseResult.halalAnalysis.status}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Certification</span>
                <div className="mt-1 text-slate-300 font-medium">
                  {baseResult.certification.status === 'VERIFIED' ? '✓ Verified' : 'Not on packaging'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Questionable Ingredients</span>
                <div className="mt-1 text-slate-300 font-mono text-[11px]">
                  {baseResult.halalAnalysis.verifyCount} require check
                </div>
              </div>
            </div>
          </div>

          {/* Column B: Candidate Product */}
          {candidateResult && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Product B</span>
                <h3 className="text-sm font-bold text-white truncate">
                  {candidateResult.product?.name}
                </h3>
                <p className="text-[11px] text-slate-400">{candidateResult.product?.brand}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Pork Status</span>
                  <div
                    className={`mt-1 font-bold ${
                      candidateResult.porkCheck.status === 'PORK_DETECTED'
                        ? 'text-rose-400'
                        : candidateResult.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {candidateResult.porkCheck.status === 'PORK_DETECTED'
                      ? '🔴 Pork Detected'
                      : candidateResult.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                      ? '🟡 Needs Verification'
                      : '🟢 Pork-Free Declared'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Halal Assessment</span>
                  <div
                    className={`mt-1 font-bold ${
                      candidateResult.halalAnalysis.status === 'NOT_HALAL' || candidateResult.halalAnalysis.status === 'PORK_DERIVED'
                        ? 'text-rose-400'
                        : candidateResult.halalAnalysis.status === 'SOURCE_DEPENDENT'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {candidateResult.halalAnalysis.status}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Certification</span>
                  <div className="mt-1 text-slate-300 font-medium">
                    {candidateResult.certification.status === 'VERIFIED' ? '✓ Verified' : 'Not on packaging'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Questionable Ingredients</span>
                  <div className="mt-1 text-slate-300 font-mono text-[11px]">
                    {candidateResult.halalAnalysis.verifyCount} require check
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verdict Recommendation Box */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-slate-300 space-y-1.5">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Comparison Verdict
          </div>
          <p className="leading-relaxed">
            {candidateResult && candidateResult.certification.status === 'VERIFIED'
              ? `Product B (${candidateResult.product?.name}) is officially Halal certified with documented compliance.`
              : baseResult.porkCheck.status === 'PORK_DETECTED'
              ? 'Product A contains explicit pork ingredients and must be avoided.'
              : 'Choose the product with fewer unverified additives or documented vegetarian/halal certification.'}
          </p>
        </div>
      </div>
    </div>
  );
};
