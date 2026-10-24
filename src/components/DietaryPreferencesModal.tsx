/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, SlidersHorizontal, Shield, AlertTriangle, Check } from 'lucide-react';
import { DietaryFilterPreferences } from '../types/halal';

interface DietaryPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DietaryFilterPreferences;
  onUpdatePreferences: (updated: DietaryFilterPreferences) => void;
}

export const DietaryPreferencesModal: React.FC<DietaryPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof Omit<DietaryFilterPreferences, 'allergens'>) => {
    onUpdatePreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleAllergenToggle = (allergenKey: keyof DietaryFilterPreferences['allergens']) => {
    onUpdatePreferences({
      ...preferences,
      allergens: {
        ...preferences.allergens,
        [allergenKey]: !preferences.allergens[allergenKey],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Personal Dietary Profile & Filters
              </h2>
              <p className="text-[11px] text-slate-400">
                Tailor HALALENS alerts to your specific dietary criteria
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Halal & Religious Dietary Preferences */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Halal Dietary Focus
          </h3>

          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Strict Halal Certification Only</div>
                <div className="text-[11px] text-slate-400">Flag products unless certified by an accredited authority</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.strictHalalCertified}
                onChange={() => handleToggle('strictHalalCertified')}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Alcohol & Wine Avoidance</div>
                <div className="text-[11px] text-slate-400">Strictly flag cooking wine, beer extracts, and rum aromas</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.avoidAlcohol}
                onChange={() => handleToggle('avoidAlcohol')}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Avoid Carmine / Cochineal (E120)</div>
                <div className="text-[11px] text-slate-400">Prohibit insect-derived red food colorings</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.avoidCarmineE120}
                onChange={() => handleToggle('avoidCarmineE120')}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Vegetarian / Vegan Standard</div>
                <div className="text-[11px] text-slate-400">Exclude all animal tissues, slaughter byproducts, and rennet</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.vegetarian}
                onChange={() => handleToggle('vegetarian')}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Separated Allergen Section (Section 30: Strictly separated from Halal classification) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Allergen Cross-Check (Independent from Halal)
            </h3>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-2 text-[11px] text-amber-300/90 leading-tight">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Medical Notice:</strong> Allergy detection is completely distinct from Halal assessment. For severe allergies or anaphylaxis, always consult physical manufacturer packaging.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(preferences.allergens).map(([key, val]) => (
              <label
                key={key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer"
              >
                <span className="capitalize text-slate-200">{key}</span>
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => handleAllergenToggle(key as keyof DietaryFilterPreferences['allergens'])}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
