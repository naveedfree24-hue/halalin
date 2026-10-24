/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Copy,
  Check,
  ArrowLeft,
  Bookmark,
  Share2,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { AnalysisResult, AnalyzedIngredient } from '../types/halal';
import { generateManufacturerInquiry } from '../engine/classification';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface ProductResultViewProps {
  result: AnalysisResult;
  onBack: () => void;
  onToggleSave: (result: AnalysisResult) => void;
  isSaved: boolean;
  onOpenCompare: (result: AnalysisResult) => void;
  onOpenReportCorrection: (result: AnalysisResult) => void;
  onSelectAlternative: (barcode: string) => void;
  currentLang: SupportedLanguage;
}

export const ProductResultView: React.FC<ProductResultViewProps> = ({
  result,
  onBack,
  onToggleSave,
  isSaved,
  onOpenCompare,
  onOpenReportCorrection,
  onSelectAlternative,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isRTL = currentLang === 'ar';

  const [expandedIngredientIndex, setExpandedIngredientIndex] = useState<number | null>(0);
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [showScientificDetails, setShowScientificDetails] = useState<Record<number, boolean>>({});

  const { product, porkCheck, halalAnalysis, certification, analyzedIngredients, provenance } = result;

  // Extract ambiguous ingredients for manufacturer inquiry
  const ambiguousNames = analyzedIngredients
    .filter((ing) => ing.needsSourceVerification)
    .map((ing) => ing.matchedAdditive?.name || ing.matchedIngredient?.canonicalName || ing.rawText);

  const inquiryLetter = generateManufacturerInquiry(
    product?.name || 'Packaged Product',
    product?.brand || 'Manufacturer',
    ambiguousNames.length > 0 ? ambiguousNames : ['Food emulsifiers & flavourings'],
    result.detectedLanguage || currentLang
  );

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(`${inquiryLetter.subject}\n\n${inquiryLetter.body}`);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const toggleScientific = (index: number) => {
    setShowScientificDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scanner</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSave(result)}
            className={`p-2 rounded-xl border transition-colors ${
              isSaved
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Save Product"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => onOpenCompare(result)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Compare with another product"
          >
            <Scale className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenReportCorrection(result)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Report Data Discrepancy"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Product Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Product Image / Visual Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {product?.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  // Fallback to styled SVG badge
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Layers className="w-10 h-10 text-slate-600" />
            )}
          </div>

          {/* Product Identification Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 flex-wrap">
              <span className="font-semibold text-emerald-400">{product?.brand || 'Packaged Goods'}</span>
              <span>·</span>
              <span>{product?.marketCountry || 'Europe / Global Market'}</span>
              {product?.packageSize && (
                <>
                  <span>·</span>
                  <span>{product.packageSize}</span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {product?.name || 'Scanned Ingredient Label'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono flex-wrap">
              {product?.ean && (
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  BARCODE: {product.ean}
                </span>
              )}
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                LANG: {result.detectedLanguage.toUpperCase()}
              </span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">
                CONFIDENCE: {halalAnalysis.confidenceScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE PILLAR ASSESSMENTS GRID (Sections 11 & 12) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Dedicated PORK CHECK */}
        <div
          className={`rounded-2xl p-4 border flex flex-col justify-between ${
            porkCheck.status === 'PORK_DETECTED'
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/20'
              : porkCheck.status === 'POSSIBLE_PORK_SOURCE'
              ? 'bg-amber-950/40 border-amber-500/60'
              : 'bg-emerald-950/40 border-emerald-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                {t.porkStatusTitle}
              </span>
              {porkCheck.status === 'PORK_DETECTED' ? (
                <XCircle className="w-5 h-5 text-rose-400" />
              ) : porkCheck.status === 'POSSIBLE_PORK_SOURCE' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <h3 className="text-sm font-extrabold tracking-tight mb-1 text-white">
              {porkCheck.status === 'PORK_DETECTED'
                ? t.porkDetected
                : porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                ? t.possiblePork
                : t.noPorkDetected}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {porkCheck.explanation}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Accuracy: Deterministic Rules</span>
            <span className="font-semibold text-slate-200">{porkCheck.confidence}</span>
          </div>
        </div>

        {/* Pillar 2: HALAL INGREDIENT ANALYSIS */}
        <div
          className={`rounded-2xl p-4 border flex flex-col justify-between ${
            halalAnalysis.status === 'PORK_DERIVED' || halalAnalysis.status === 'NOT_HALAL'
              ? 'bg-rose-950/40 border-rose-600/60'
              : halalAnalysis.status === 'SOURCE_DEPENDENT' || halalAnalysis.status === 'MASHBOOH'
              ? 'bg-amber-950/40 border-amber-500/60'
              : 'bg-emerald-950/40 border-emerald-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                {t.halalAnalysisTitle}
              </span>
              {halalAnalysis.status === 'PORK_DERIVED' || halalAnalysis.status === 'NOT_HALAL' ? (
                <XCircle className="w-5 h-5 text-rose-400" />
              ) : halalAnalysis.status === 'SOURCE_DEPENDENT' || halalAnalysis.status === 'MASHBOOH' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <h3 className="text-sm font-extrabold tracking-tight mb-1 text-white">
              {halalAnalysis.status === 'PORK_DERIVED' || halalAnalysis.status === 'NOT_HALAL'
                ? t.notHalal
                : halalAnalysis.status === 'SOURCE_DEPENDENT'
                ? t.sourceDependent
                : t.halalCompatible}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {halalAnalysis.summary}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>{halalAnalysis.noConcernCount} clear · {halalAnalysis.verifyCount} verify</span>
            <span className="font-semibold text-slate-200">{halalAnalysis.confidenceScore}%</span>
          </div>
        </div>

        {/* Pillar 3: CERTIFICATION VERIFICATION */}
        <div
          className={`rounded-2xl p-4 border flex flex-col justify-between ${
            certification.status === 'VERIFIED'
              ? 'bg-emerald-950/40 border-emerald-500/60'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                {t.certificationTitle}
              </span>
              <HelpCircle
                className={`w-5 h-5 ${
                  certification.status === 'VERIFIED' ? 'text-emerald-400' : 'text-slate-500'
                }`}
              />
            </div>
            <h3 className="text-sm font-extrabold tracking-tight mb-1 text-white">
              {certification.status === 'VERIFIED' ? t.verifiedCert : t.notVerifiedCert}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {certification.details}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Audited Record</span>
            <span className="font-semibold text-slate-300">
              {certification.status === 'VERIFIED' ? 'Official Certificate' : 'Not on pack'}
            </span>
          </div>
        </div>
      </div>

      {/* INGREDIENTS REQUIRING ATTENTION ACCORDION (Section 11 & 38) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.ingredientsToVerify}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of {analyzedIngredients.length} detected ingredients with scientific origins
            </p>
          </div>
          {ambiguousNames.length > 0 && (
            <button
              onClick={() => setShowManufacturerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t.askManufacturer}</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800">
          {analyzedIngredients.map((ing, idx) => {
            const isExpanded = expandedIngredientIndex === idx;
            const isConcern = ing.flagged || ing.needsSourceVerification;

            return (
              <div key={idx} className="py-3 first:pt-0 last:pb-0">
                <button
                  onClick={() => setExpandedIngredientIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left group gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        ing.halalStatus === 'PORK_DERIVED' || ing.halalStatus === 'NOT_HALAL'
                          ? 'bg-rose-500'
                          : ing.needsSourceVerification
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <div className="truncate">
                      <span className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                        {ing.matchedAdditive?.eNumber || ing.matchedIngredient?.canonicalName || ing.rawText}
                      </span>
                      {ing.matchedAdditive && (
                        <span className="text-xs text-slate-400 ml-2">
                          ({ing.matchedAdditive.name})
                        </span>
                      )}
                      {ing.overrideContext && (
                        <span className="text-[11px] text-emerald-400 ml-2">
                          [{ing.overrideContext}]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        ing.halalStatus === 'PORK_DERIVED'
                          ? 'bg-rose-950 border-rose-800 text-rose-300'
                          : ing.needsSourceVerification
                          ? 'bg-amber-950 border-amber-800 text-amber-300'
                          : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {ing.halalStatus === 'PORK_DERIVED'
                        ? 'Pork'
                        : ing.needsSourceVerification
                        ? 'Verify Origin'
                        : 'Permissible'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Explanatory Accordion (Section 38) */}
                {isExpanded && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-3">
                    <div>
                      <span className="text-slate-400 font-medium">Original label text: </span>
                      <span className="text-slate-200 font-mono italic">"{ing.rawText}"</span>
                    </div>

                    <div>
                      <span className="text-emerald-400 font-semibold">Assessment & Reason: </span>
                      <p className="text-slate-300 mt-1 leading-relaxed">{ing.reason}</p>
                    </div>

                    {ing.matchedAdditive && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 font-medium">Functional Use: </span>
                          <p className="text-slate-300">{ing.matchedAdditive.function}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Pork Origin Risk: </span>
                          <p className="text-slate-300">
                            {ing.matchedAdditive.porkOriginPossible
                              ? '⚠️ Cannot be excluded without manufacturer verification'
                              : '✓ No pork expected'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Scientific details disclosure toggle */}
                    {(ing.matchedAdditive?.scientificDetails || ing.matchedIngredient?.scientificDetails) && (
                      <div className="pt-2">
                        <button
                          onClick={() => toggleScientific(idx)}
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{showScientificDetails[idx] ? 'Hide' : 'Show'} Scientific & Chemical Details</span>
                        </button>
                        {showScientificDetails[idx] && (
                          <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed">
                            {ing.matchedAdditive?.scientificDetails || ing.matchedIngredient?.scientificDetails}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RECOMMENDED HALAL ALTERNATIVES (Section 32) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{t.findAlternatives}</span>
        </h3>
        <p className="text-xs text-slate-400">
          Clean products in the same category with verified Halal certification or 100% plant origins:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => onSelectAlternative('8690504100104')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
              ✓
            </div>
            <div className="truncate">
              <h4 className="text-xs font-semibold text-white truncate">Haribo Halal Goldbears</h4>
              <p className="text-[11px] text-emerald-400">Halal Beef Gelatin (JAKIM Accredited)</p>
            </div>
          </div>

          <div
            onClick={() => onSelectAlternative('5410126006957')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
              ✓
            </div>
            <div className="truncate">
              <h4 className="text-xs font-semibold text-white truncate">Lotus Biscoff Original Spread</h4>
              <p className="text-[11px] text-emerald-400">100% Plant-Based (HFCE Certified)</p>
            </div>
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE & TRANSPARENCY (Section 47 & 93) */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Data Provenance & Engine Verification</span>
          <span>Verified: {provenance.lastVerified}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
          <div>Source: {provenance.source}</div>
          <div>Standards: {provenance.ruleSet}</div>
        </div>
        <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
          {t.disclaimer}
        </p>
      </div>

      {/* MODAL: ASK THE MANUFACTURER (Section 39) */}
      {showManufacturerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Ask Manufacturer Inquiry</h3>
              </div>
              <button
                onClick={() => setShowManufacturerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Localized inquiry letter in <span className="text-emerald-400 font-semibold">{result.detectedLanguage.toUpperCase()}</span> requesting ingredient transparency from the manufacturer:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div>
                <span className="text-slate-500">Subject: </span>
                <span className="text-slate-200">{inquiryLetter.subject}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 whitespace-pre-line max-h-56 overflow-y-auto">
                {inquiryLetter.body}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyLetter}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-colors"
              >
                {copiedLetter ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLetter ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
              </button>
              <button
                onClick={() => setShowManufacturerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
