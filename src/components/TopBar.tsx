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
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EBE3D7] px-4 md:px-8 py-3.5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2B1810] flex items-center justify-center text-[#E8D8B8] shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#2B1810] whitespace-nowrap">
                Halal<span className="text-[#C5A059]">in'</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-[#785E4F] ml-2 font-medium tracking-wide">
                Food Intelligence AI
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean, Unboxed Editorial Typography) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#6B5145]">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-[#2B1810] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.homeNav}
          </button>
          <button
            onClick={() => onNavigate('scan')}
            className="hover:text-[#2B1810] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.scanNav}
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="hover:text-[#2B1810] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.searchNav}
          </button>
          <button
            onClick={() => onNavigate('additives')}
            className="hover:text-[#2B1810] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.eNumberCheckTitle}
          </button>
          <button
            onClick={() => onNavigate('certifiers')}
            className="hover:text-[#2B1810] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.certCheckTitle}
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className="hover:text-[#2B1810] transition-colors whitespace-nowrap text-[#9C8274] cursor-pointer"
          >
            {t.adminNav}
          </button>
        </nav>

        {/* Zone 3: Controls (Travel Country, Language & Diet Filters) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Travel Country Trigger */}
          <button
            onClick={onOpenTravelMode}
            title={t.travelMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#3D2419] hover:border-[#C5A059] shadow-sm transition-all cursor-pointer"
          >
            <Plane className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="whitespace-nowrap">{travelCountry}</span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2.5 text-[#785E4F] pointer-events-none" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#3D2419] hover:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] shadow-sm cursor-pointer appearance-none"
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
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-[#2B1810] hover:bg-[#43271A] text-[#FAF7F2] font-semibold text-xs shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            Diet Filters
          </button>
        </div>
      </div>
    </header>
  );
};
