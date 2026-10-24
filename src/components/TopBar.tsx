/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { Globe, Plane, ShieldCheck } from 'lucide-react';

interface TopBarProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  travelCountry: string;
  onOpenTravelMode: () => void;
  onNavigate: (view: 'home' | 'scan' | 'search' | 'saved' | 'admin' | 'additives' | 'certifiers') => void;
  onOpenPreferences: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentLang,
  onLanguageChange,
  travelCountry,
  onOpenTravelMode,
  onNavigate,
  onOpenPreferences,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isRTL = currentLang === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                Halal<span className="text-emerald-400">in'</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean typography) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.homeNav}
          </button>
          <button
            onClick={() => onNavigate('scan')}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.scanNav}
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.searchNav}
          </button>
          <button
            onClick={() => onNavigate('additives')}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.eNumberCheckTitle}
          </button>
          <button
            onClick={() => onNavigate('certifiers')}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.certCheckTitle}
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className="hover:text-emerald-400 transition-colors whitespace-nowrap text-slate-500"
          >
            {t.adminNav}
          </button>
        </nav>

        {/* Zone 3: Controls (Travel Country & Language Selector) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Travel Country Trigger */}
          <button
            onClick={onOpenTravelMode}
            title={t.travelMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Plane className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium whitespace-nowrap">{travelCountry}</span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2 text-slate-400 pointer-events-none" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="pl-7 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
              <option value="es">ES</option>
              <option value="it">IT</option>
              <option value="tr">TR</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Diet Preferences Quick Button */}
          <button
            onClick={onOpenPreferences}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm shadow-emerald-950 transition-colors whitespace-nowrap"
          >
            Diet Filters
          </button>
        </div>
      </div>
    </header>
  );
};
