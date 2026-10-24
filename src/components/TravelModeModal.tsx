/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Plane, Check, Globe } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

export interface TravelDestination {
  country: string;
  flag: string;
  code: string;
  primaryLang: SupportedLanguage;
  localPorkTerms: string[];
  localCertifier: string;
  tips: string;
}

export const TRAVEL_DESTINATIONS: TravelDestination[] = [
  {
    country: 'France',
    flag: '🇫🇷',
    code: 'FR',
    primaryLang: 'fr',
    localPorkTerms: ['saindoux (lard)', 'gélatine de porc', 'graisse de porc', 'lardons'],
    localCertifier: 'AFCA Halal / Grand Mosque of Paris / HFCE Brussels',
    tips: 'Watch out for "gélatine" in yogurts and mousses, and "mono- et diglycérides" (E471) in packaged brioches.',
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    code: 'DE',
    primaryLang: 'de',
    localPorkTerms: ['Schweinefleisch', 'Schweineschmalz (lard)', 'Schweinegelatine'],
    localCertifier: 'HALAL CONTROL GmbH Germany',
    tips: 'German Haribo Goldbären use pork gelatin. Look for Turkish imported versions or "vegetarisch" labels.',
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    code: 'GB',
    primaryLang: 'en',
    localPorkTerms: ['pork', 'lard', 'pork fat', 'porcine gelatine'],
    localCertifier: 'Halal Monitoring Committee (HMC) & Halal Food Authority (HFA)',
    tips: 'UK legislation requires vegetarian cheeses to specify microbial rennet. Mature cheddar with traditional rennet is animal-derived.',
  },
  {
    country: 'Italy',
    flag: '🇮🇹',
    code: 'IT',
    primaryLang: 'it',
    localPorkTerms: ['strutto (lard)', 'grasso di maiale', 'gelatina suina', 'lardo'],
    localCertifier: 'Halal Italia / Halal Quality Control',
    tips: 'Traditional Italian bakery goods (like piadine, focaccia, and sfogliatelle) frequently use "strutto" (pork lard).',
  },
  {
    country: 'Spain',
    flag: '🇪🇸',
    code: 'ES',
    primaryLang: 'es',
    localPorkTerms: ['manteca de cerdo (lard)', 'grasa de cerdo', 'gelatina de cerdo'],
    localCertifier: 'Instituto Halal de España',
    tips: 'Traditional Spanish pastries (mantecados, polvorones, ensaimadas) heavily rely on manteca de cerdo.',
  },
  {
    country: 'Turkey',
    flag: '🇹🇷',
    code: 'TR',
    primaryLang: 'tr',
    localPorkTerms: ['domuz eti', 'domuz yağı', 'domuz jelatini'],
    localCertifier: 'TSE Halal / GİMDES',
    tips: 'Standard domestic products are Halal-compliant; check imported luxury snacks and international specialty grocers.',
  },
  {
    country: 'United States',
    flag: '🇺🇸',
    code: 'US',
    primaryLang: 'en',
    localPorkTerms: ['pork', 'lard', 'pork gelatin', 'pork enzyme'],
    localCertifier: 'IFANCA (Crescent-M) / ISA Halal',
    tips: 'Gelatin in marshmallows, gummy candies, and frosted toaster pastries is almost exclusively pork unless certified Kosher/Halal.',
  },
];

interface TravelModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCountry: string;
  onSelectCountry: (dest: TravelDestination) => void;
}

export const TravelModeModal: React.FC<TravelModeModalProps> = ({
  isOpen,
  onClose,
  currentCountry,
  onSelectCountry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                HALALENS International Travel Mode
              </h2>
              <p className="text-[11px] text-slate-400">
                Adapts ingredient vocabulary, local additive standards, and certifiers
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Traveling abroad? Select your destination country to calibrate the scanner's local vocabulary detection:
          </p>

          <div className="space-y-2">
            {TRAVEL_DESTINATIONS.map((dest) => {
              const isSelected = currentCountry.includes(dest.country);

              return (
                <div
                  key={dest.code}
                  onClick={() => {
                    onSelectCountry(dest);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-850 border-emerald-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{dest.flag}</span>
                      <span className="text-sm font-bold text-white">{dest.country}</span>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[11px] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <div className="text-[11px] text-slate-400">
                      <span className="text-rose-400 font-semibold">Local pork terms: </span>
                      {dest.localPorkTerms.join(' · ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-semibold">Local certifiers: </span>
                      {dest.localCertifier}
                    </div>
                    <p className="text-[11px] text-slate-300 italic pt-1">
                      💡 {dest.tips}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
