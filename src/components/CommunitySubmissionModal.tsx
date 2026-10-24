/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Camera, Check, ShieldAlert, HeartHandshake } from 'lucide-react';
import { CommunitySubmission } from '../types/halal';

interface CommunitySubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBarcode?: string;
  initialIngredients?: string;
  onSubmit: (submission: CommunitySubmission) => void;
}

export const CommunitySubmissionModal: React.FC<CommunitySubmissionModalProps> = ({
  isOpen,
  onClose,
  initialBarcode = '',
  initialIngredients = '',
  onSubmit,
}) => {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode);
  const [country, setCountry] = useState('France');
  const [ingredientsText, setIngredientsText] = useState(initialIngredients);
  const [contributorName, setContributorName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productName.trim() && ingredientsText.trim()) {
      const submission: CommunitySubmission = {
        id: 'sub_' + Date.now(),
        productName: productName.trim(),
        brand: brand.trim() || 'Unspecified',
        barcode: barcode.trim(),
        country,
        ingredientsText: ingredientsText.trim(),
        contributorName: contributorName.trim() || 'Anonymous Contributor',
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        upvotes: 1,
      };

      onSubmit(submission);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Contribute to HALALENS Database
              </h2>
              <p className="text-[11px] text-slate-400">
                Help the global community verify unlisted packaging
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Submission Queued for Review!</h3>
            <p className="text-xs text-slate-400">
              Thank you for contributing. Our specialist review queue will verify the packaging against our ingredient ontology.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Croissant Pur Beurre"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Brand / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Pasquier, Barilla"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Barcode (EAN/UPC)</label>
                <input
                  type="text"
                  placeholder="e.g. 3270190012234"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Market Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="France">France 🇫🇷</option>
                <option value="Germany">Germany 🇩🇪</option>
                <option value="United Kingdom">United Kingdom 🇬🇧</option>
                <option value="United States">United States 🇺🇸</option>
                <option value="Italy">Italy 🇮🇹</option>
                <option value="Spain">Spain 🇪🇸</option>
                <option value="Turkey">Turkey 🇹🇷</option>
                <option value="Canada">Canada 🇨🇦</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Full Ingredients Text *</label>
              <textarea
                rows={4}
                required
                placeholder="Paste or type ingredients exactly as written on packaging..."
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Your Name / Handle (Optional)</label>
              <input
                type="text"
                placeholder="e.g. HalalShopper99"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <Send className="w-4 h-4" />
                Submit for Verification
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
