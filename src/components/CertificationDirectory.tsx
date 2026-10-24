/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CERTIFICATION_AUTHORITIES } from '../data/certifiersDb';
import { CertificationAuthority } from '../types/halal';
import { ShieldCheck, ExternalLink, Search, Globe, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export const CertificationDirectory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');

  const filtered = CERTIFICATION_AUTHORITIES.filter((cert) => {
    const matchQuery =
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.shortName.toLowerCase().includes(search.toLowerCase()) ||
      cert.country.toLowerCase().includes(search.toLowerCase());

    if (!matchQuery) return false;
    if (selectedCountry !== 'ALL' && cert.country !== selectedCountry) return false;
    return true;
  });

  const countries = Array.from(new Set(CERTIFICATION_AUTHORITIES.map((c) => c.country)));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Halal Certification Authority Directory
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Recognized certification bodies in the UK, Europe, North America, and international accreditation networks.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search certifier or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Country Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCountry('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedCountry === 'ALL'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Regions
        </button>
        {countries.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCountry(c)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCountry === c
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Certifier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cert) => (
          <div
            key={cert.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                    {cert.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {cert.shortName}
                    </h3>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      {cert.country}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 shrink-0">
                  Accredited
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <p className="line-clamp-2">{cert.name}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium">Scope: </span>
                  <span className="text-slate-300">{cert.scope}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium">Standard: </span>
                  <span className="text-slate-300">{cert.standardsBody}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <a
                href={cert.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Official Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {cert.verificationUrl && (
                <a
                  href={cert.verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline text-[11px] font-medium"
                >
                  Verify Certificate
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
