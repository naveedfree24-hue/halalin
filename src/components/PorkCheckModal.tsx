/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, ShieldCheck, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { runHalalAnalysis } from '../engine/classification';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface PorkCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export const PorkCheckModal: React.FC<PorkCheckModalProps> = ({
  isOpen,
  onClose,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<ReturnType<typeof runHalalAnalysis> | null>(null);

  if (!isOpen) return null;

  const handleRunCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      const res = runHalalAnalysis(inputText.trim());
      setAnalysis(res);
    }
  };

  const handleQuickPaste = (sample: string) => {
    setInputText(sample);
    const res = runHalalAnalysis(sample);
    setAnalysis(res);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <span className="text-base">🐷</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Dedicated Pork & Porcine Detector
              </h2>
              <p className="text-[11px] text-slate-400">
                Instant scanning across 25+ European & global language terminology
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Text Form */}
        <form onSubmit={handleRunCheck} className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Paste ingredient list or single suspicious term:
          </label>
          <textarea
            rows={3}
            placeholder="e.g. saindoux, Schweinegelatine, lard, mono- et diglycérides d'acides gras..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Search className="w-4 h-4" />
              Run Pork Check
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setAnalysis(null);
              }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Quick Test Chips */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5">Quick multi-language test phrases:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickPaste('Farine, saindoux, sucre, sel')}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-[11px] text-slate-300"
            >
              🇫🇷 saindoux (Lard)
            </button>
            <button
              onClick={() => handleQuickPaste('Glukosesirup, Schweinegelatine, Zucker')}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-[11px] text-slate-300"
            >
              🇩🇪 Schweinegelatine
            </button>
            <button
              onClick={() => handleQuickPaste('Mono- and diglycerides of fatty acids, sugar')}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500 text-[11px] text-slate-300"
            >
              🇬🇧 E471 (Ambiguous Fat)
            </button>
            <button
              onClick={() => handleQuickPaste('Farine de blé, huile de colza, sucre, sel')}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500 text-[11px] text-slate-300"
            >
              🌿 100% Plant Oil
            </button>
          </div>
        </div>

        {/* Pork Check Analysis Result */}
        {analysis && (
          <div
            className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              analysis.porkCheck.status === 'PORK_DETECTED'
                ? 'bg-rose-950/60 border-rose-600 text-rose-100'
                : analysis.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                ? 'bg-amber-950/60 border-amber-500 text-amber-100'
                : 'bg-emerald-950/60 border-emerald-500 text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {analysis.porkCheck.status === 'PORK_DETECTED' ? (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : analysis.porkCheck.status === 'POSSIBLE_PORK_SOURCE' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <h4 className="text-xs font-extrabold tracking-wide uppercase">
                {analysis.porkCheck.status === 'PORK_DETECTED'
                  ? 'Pork Ingredient Explicitly Detected'
                  : analysis.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                  ? 'Possible Animal Fat — Pork Cannot Be Excluded'
                  : 'No Declared Pork Derivative Found'}
              </h4>
            </div>

            <p className="text-xs leading-relaxed opacity-90">
              {analysis.porkCheck.explanation}
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] opacity-80">
              <span>Detected Language: {analysis.detectedLanguage.toUpperCase()}</span>
              <span>Confidence: {analysis.porkCheck.confidence}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
