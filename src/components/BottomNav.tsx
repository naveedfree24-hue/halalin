/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Scan, Search, Bookmark, ShieldAlert } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: 'home' | 'scan' | 'search' | 'saved' | 'admin' | 'additives' | 'certifiers') => void;
  onOpenScanModal: () => void;
  savedCount: number;
  currentLang: SupportedLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenScanModal,
  savedCount,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isRTL = currentLang === 'ar';

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-lg border-t border-[#EBE3D7] px-2 py-1.5 shadow-lg"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* Tab 1: Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            currentView === 'home' ? 'text-[#2B1810] font-bold' : 'text-[#8A7061] hover:text-[#2B1810]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t.homeNav}</span>
        </button>

        {/* Tab 2: Search */}
        <button
          onClick={() => onNavigate('search')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            currentView === 'search' ? 'text-[#2B1810] font-bold' : 'text-[#8A7061] hover:text-[#2B1810]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t.searchNav}</span>
        </button>

        {/* Tab 3: Central Scan Action (Elevated Thumb Target) */}
        <div className="flex justify-center items-center -mt-4">
          <button
            onClick={onOpenScanModal}
            className="w-13 h-13 rounded-2xl bg-[#2B1810] text-[#E8D8B8] flex items-center justify-center shadow-lg shadow-[#2B1810]/25 active:scale-95 transition-transform cursor-pointer"
            aria-label={t.scanProduct}
          >
            <Scan className="w-6 h-6 stroke-[2.2] text-[#C5A059]" />
          </button>
        </div>

        {/* Tab 4: Additives / E-Numbers */}
        <button
          onClick={() => onNavigate('additives')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            currentView === 'additives' ? 'text-[#2B1810] font-bold' : 'text-[#8A7061] hover:text-[#2B1810]'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">E-Guide</span>
        </button>

        {/* Tab 5: Saved */}
        <button
          onClick={() => onNavigate('saved')}
          className={`min-h-[44px] flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
            currentView === 'saved' ? 'text-[#2B1810] font-bold' : 'text-[#8A7061] hover:text-[#2B1810]'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t.savedNav}</span>
          {savedCount > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-[#C5A059] text-white text-[9px] font-bold flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
