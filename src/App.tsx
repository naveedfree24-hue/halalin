/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Scan,
  Barcode,
  Search,
  Sparkles,
  ShieldCheck,
  Building2,
  Plane,
  WifiOff,
  SlidersHorizontal,
  Bookmark,
  ChevronRight,
  ArrowRight,
  Camera,
  AlertTriangle,
  Info,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Scale,
  Zap,
} from 'lucide-react';

import { PRODUCTS_DATABASE } from './data/productsDb';
import { ADDITIVES_DATABASE } from './data/additivesDb';
import { runHalalAnalysis } from './engine/classification';
import { AnalysisResult, CommunitySubmission, DietaryFilterPreferences, Product } from './types/halal';
import { SupportedLanguage, TRANSLATIONS } from './i18n/translations';

import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { CameraScannerModal } from './components/CameraScannerModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ProductResultView } from './components/ProductResultView';
import { PorkCheckModal } from './components/PorkCheckModal';
import { ENumberExplorer } from './components/ENumberExplorer';
import { CertificationDirectory } from './components/CertificationDirectory';
import { TravelModeModal, TravelDestination, TRAVEL_DESTINATIONS } from './components/TravelModeModal';
import { OfflineModeModal } from './components/OfflineModeModal';
import { DietaryPreferencesModal } from './components/DietaryPreferencesModal';
import { CompareModal } from './components/CompareModal';
import { CommunitySubmissionModal } from './components/CommunitySubmissionModal';
import { UnifiedScannerView } from './components/UnifiedScannerView';

export default function App() {
  // Global View Navigation State
  const [currentView, setCurrentView] = useState<
    'home' | 'scan' | 'search' | 'saved' | 'admin' | 'additives' | 'certifiers' | 'result'
  >('home');

  // Language & Localization
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [travelCountry, setTravelCountry] = useState<string>('🇫🇷 France');
  const t = TRANSLATIONS[currentLang];
  const isRTL = currentLang === 'ar';

  // Analysis State
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

  // Modals Visibility
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPorkCheckModal, setShowPorkCheckModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [compareBaseResult, setCompareBaseResult] = useState<AnalysisResult | null>(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'PRODUCTS' | 'ADDITIVES'>('ALL');

  // Saved Results & History
  const [savedResults, setSavedResults] = useState<AnalysisResult[]>(() => {
    try {
      const stored = localStorage.getItem('halalens_saved');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Recent Scans
  const [recentScans, setRecentScans] = useState<AnalysisResult[]>(() => {
    // Initial pre-loaded scans for instant exploration
    const p1 = PRODUCTS_DATABASE[0]; // Nutella Biscuits
    const p2 = PRODUCTS_DATABASE[1]; // Haribo Chamallows
    const p3 = PRODUCTS_DATABASE[4]; // Lotus Biscoff
    return [
      runHalalAnalysis(p1.ingredientsRaw, p1),
      runHalalAnalysis(p2.ingredientsRaw, p2),
      runHalalAnalysis(p3.ingredientsRaw, p3),
    ];
  });

  // User Dietary Preferences
  const [preferences, setPreferences] = useState<DietaryFilterPreferences>(() => {
    try {
      const stored = localStorage.getItem('halalens_diet_prefs');
      return stored
        ? JSON.parse(stored)
        : {
            porkFreeOnly: true,
            strictHalalCertified: false,
            avoidAlcohol: true,
            vegetarian: false,
            vegan: false,
            avoidGelatin: false,
            avoidCarmineE120: true,
            avoidShellacE904: false,
            allergens: {
              gluten: false,
              peanuts: false,
              treeNuts: false,
              dairy: false,
              soy: false,
              eggs: false,
              shellfish: false,
            },
          };
    } catch {
      return {
        porkFreeOnly: true,
        strictHalalCertified: false,
        avoidAlcohol: true,
        vegetarian: false,
        vegan: false,
        avoidGelatin: false,
        avoidCarmineE120: true,
        avoidShellacE904: false,
        allergens: {
          gluten: false,
          peanuts: false,
          treeNuts: false,
          dairy: false,
          soy: false,
          eggs: false,
          shellfish: false,
        },
      };
    }
  });

  // Community Submissions State
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([
    {
      id: 'sub_1',
      productName: 'Madeleines au Pur Beurre',
      brand: 'St Michel',
      barcode: '3178530409923',
      country: 'France',
      ingredientsText: 'Farine de blé, beurre frais 26%, sucre, œufs de poules élevées en plein air, sel, poudre à lever (carbonates de sodium).',
      contributorName: 'Karim_Paris',
      timestamp: '2026-10-20T10:30:00Z',
      status: 'VERIFIED',
      upvotes: 14,
    },
    {
      id: 'sub_2',
      productName: 'Haribo Balla Stixx Strawberry',
      brand: 'Haribo',
      barcode: '4001686524313',
      country: 'Germany',
      ingredientsText: 'Zucker; Glukose-Fruktose-Sirup; Weizenmehl; Weizenstärke; Palmfett; Dextrose; Gelatine (Schwein); Emulgator: Mono- und Diglyceride von Speisefettsäuren.',
      contributorName: 'Amina_Berlin',
      timestamp: '2026-10-23T14:15:00Z',
      status: 'PENDING',
      upvotes: 6,
    },
  ]);

  // Persist saved
  useEffect(() => {
    try {
      localStorage.setItem('halalens_saved', JSON.stringify(savedResults));
    } catch {}
  }, [savedResults]);

  // Persist prefs
  useEffect(() => {
    try {
      localStorage.setItem('halalens_diet_prefs', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  // Handlers for Analysis
  const handleAnalyzeIngredientText = (rawText: string, ocrConfidence = 95) => {
    // Check if matching barcode product exists in database
    const matchingProduct = PRODUCTS_DATABASE.find(
      (p) => p.ingredientsRaw.toLowerCase().includes(rawText.substring(0, 30).toLowerCase())
    );

    const result = runHalalAnalysis(rawText, matchingProduct, ocrConfidence);
    setCurrentResult(result);
    setRecentScans((prev) => [result, ...prev.filter((r) => r.inputRawText !== rawText).slice(0, 9)]);
    setCurrentView('result');
  };

  const handleSelectProductBarcode = (barcode: string) => {
    const clean = barcode.trim();
    const product = PRODUCTS_DATABASE.find((p) => p.ean === clean || p.gtin === clean);

    if (product) {
      const result = runHalalAnalysis(product.ingredientsRaw, product, 99);
      setCurrentResult(result);
      setRecentScans((prev) => [result, ...prev.filter((r) => r.product?.id !== product.id).slice(0, 9)]);
      setCurrentView('result');
    } else {
      // Product not found workflow (Section 27)
      setShowSubmissionModal(true);
    }
  };

  const handleToggleSave = (res: AnalysisResult) => {
    const key = res.product?.id || res.inputRawText;
    setSavedResults((prev) => {
      const exists = prev.some((r) => (r.product?.id || r.inputRawText) === key);
      if (exists) {
        return prev.filter((r) => (r.product?.id || r.inputRawText) !== key);
      } else {
        return [res, ...prev];
      }
    });
  };

  const handleOpenCompare = (res: AnalysisResult) => {
    setCompareBaseResult(res);
    setShowCompareModal(true);
  };

  const handleSelectTravelCountry = (dest: TravelDestination) => {
    setTravelCountry(`${dest.flag} ${dest.country}`);
    setCurrentLang(dest.primaryLang);
  };

  const handleAddSubmission = (sub: CommunitySubmission) => {
    setSubmissions((prev) => [sub, ...prev]);
  };

  const handleApproveSubmission = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'VERIFIED' as const } : s))
    );
  };

  // Search filtered items
  const searchResultsProducts = PRODUCTS_DATABASE.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ean.includes(searchQuery) ||
      p.ingredientsRaw.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchResultsAdditives = ADDITIVES_DATABASE.filter(
    (a) =>
      a.eNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.aliases.some((alias) => alias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B1810] flex flex-col selection:bg-[#C5A059]/20 selection:text-[#2B1810] pb-20 lg:pb-0 font-sans">
      {/* Top Bar Contract (Brand - Links - Controls) */}
      <TopBar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        travelCountry={travelCountry}
        onOpenTravelMode={() => setShowTravelModal(true)}
        onNavigate={(view) => setCurrentView(view)}
        onOpenPreferences={() => setShowPreferencesModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* VIEW 1: PRODUCT RESULT VIEW */}
        {currentView === 'result' && currentResult && (
          <ProductResultView
            result={currentResult}
            onBack={() => setCurrentView('home')}
            onToggleSave={handleToggleSave}
            isSaved={savedResults.some(
              (r) => (r.product?.id || r.inputRawText) === (currentResult.product?.id || currentResult.inputRawText)
            )}
            onOpenCompare={handleOpenCompare}
            onOpenReportCorrection={() => setShowSubmissionModal(true)}
            onSelectAlternative={handleSelectProductBarcode}
            currentLang={currentLang}
          />
        )}

        {/* VIEW 2: E-NUMBER EXPLORER */}
        {currentView === 'additives' && <ENumberExplorer />}

        {/* VIEW 3: CERTIFICATION DIRECTORY */}
        {currentView === 'certifiers' && <CertificationDirectory />}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('home')}
              className="text-xs text-[#785E4F] hover:text-[#2B1810] flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              ← Back to Halalin'
            </button>
            <div className="bg-white border border-[#E8DFD5] rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#2B1810] mb-2">Halalin' Verification Console</h2>
              <p className="text-xs text-[#785E4F] mb-6">
                Internal ingredient intelligence, database health, and verification queue monitoring.
              </p>
              <button
                onClick={() => setShowSubmissionModal(true)}
                className="px-4 py-2 rounded-xl bg-[#2B1810] hover:bg-[#3D2318] text-[#FAF7F2] font-medium text-xs mb-4 transition-colors cursor-pointer"
              >
                + Submit Test Product
              </button>
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#2B1810] text-sm">{sub.productName} ({sub.brand})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono font-semibold">
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-[#554035] font-mono text-[11px] mb-2">{sub.ingredientsText}</p>
                    <div className="flex justify-between text-[11px] text-[#785E4F]">
                      <span>{sub.country} · {sub.barcode || 'N/A'}</span>
                      {sub.status !== 'VERIFIED' && (
                        <button
                          onClick={() => handleApproveSubmission(sub.id)}
                          className="text-[#C5A059] hover:underline font-semibold cursor-pointer"
                        >
                          Approve Record
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: SEARCH INTELLIGENCE */}
        {currentView === 'search' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#2B1810] tracking-tight">
                Search Product & Ingredient Intelligence
              </h1>
              <p className="text-xs text-[#785E4F]">
                Instant database lookup for 25+ European & international food brands, E-numbers, and suspicious additives.
              </p>

              {/* Search Field */}
              <div className="relative mt-3">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8A7061]" />
                <input
                  type="text"
                  autoFocus
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#E8DFD5] text-sm text-[#2B1810] placeholder-[#8A7061] focus:outline-none focus:border-[#C5A059] shadow-sm"
                />
              </div>

              {/* Category Segmented Control */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setSearchCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    searchCategory === 'ALL'
                      ? 'bg-[#2B1810] text-[#FAF7F2]'
                      : 'bg-white border border-[#E8DFD5] text-[#785E4F] hover:text-[#2B1810]'
                  }`}
                >
                  All ({searchResultsProducts.length + searchResultsAdditives.length})
                </button>
                <button
                  onClick={() => setSearchCategory('PRODUCTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    searchCategory === 'PRODUCTS'
                      ? 'bg-[#2B1810] text-[#FAF7F2]'
                      : 'bg-white border border-[#E8DFD5] text-[#785E4F] hover:text-[#2B1810]'
                  }`}
                >
                  Packaged Products ({searchResultsProducts.length})
                </button>
                <button
                  onClick={() => setSearchCategory('ADDITIVES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    searchCategory === 'ADDITIVES'
                      ? 'bg-[#2B1810] text-[#FAF7F2]'
                      : 'bg-white border border-[#E8DFD5] text-[#785E4F] hover:text-[#2B1810]'
                  }`}
                >
                  E-Numbers ({searchResultsAdditives.length})
                </button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              {(searchCategory === 'ALL' || searchCategory === 'PRODUCTS') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#785E4F] uppercase tracking-wider">
                    Packaged Food Products
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResultsProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProductBarcode(p.ean)}
                        className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="truncate pr-3">
                          <div className="flex items-center gap-2 text-xs text-[#785E4F] mb-0.5">
                            <span className="font-semibold text-[#C5A059]">{p.brand}</span>
                            <span>·</span>
                            <span>{p.marketCountry}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors truncate">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-[#8A7061] font-mono">
                            {p.ean}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8A7061] group-hover:text-[#C5A059] shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(searchCategory === 'ALL' || searchCategory === 'ADDITIVES') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#785E4F] uppercase tracking-wider">
                    E-Numbers & Additives
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResultsAdditives.map((a) => (
                      <div
                        key={a.eNumber}
                        onClick={() => {
                          setCurrentView('additives');
                        }}
                        className="p-3.5 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-[#2B1810] text-sm">
                            {a.eNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                              a.halalStatus === 'NOT_HALAL' || a.halalStatus === 'PORK_DERIVED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : a.halalStatus === 'SOURCE_DEPENDENT'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {a.halalStatus === 'SOURCE_DEPENDENT' ? 'Verify' : a.halalStatus === 'NOT_HALAL' ? 'Prohibited' : 'Halal'}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#2B1810] truncate">{a.name}</h4>
                        <p className="text-[11px] text-[#785E4F] truncate mt-0.5">{a.function}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: SAVED PRODUCTS & HISTORY */}
        {currentView === 'saved' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-[#2B1810] tracking-tight">
                  Saved Products & Scan History
                </h1>
                <p className="text-xs text-[#785E4F]">
                  {savedResults.length} saved product(s) stored locally on your device
                </p>
              </div>
              {savedResults.length > 0 && (
                <button
                  onClick={() => setSavedResults([])}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {savedResults.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-[#E8DFD5] shadow-sm space-y-3">
                <Bookmark className="w-10 h-10 text-[#C5A059] mx-auto opacity-70" />
                <h3 className="text-sm font-bold text-[#2B1810]">No Saved Products Yet</h3>
                <p className="text-xs text-[#785E4F] max-w-sm mx-auto">
                  When analyzing a food package, tap the bookmark icon to save it for quick offline reference while grocery shopping.
                </p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-4 py-2 rounded-xl bg-[#2B1810] hover:bg-[#3D2318] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Start Scanning
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedResults.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentResult(r);
                      setCurrentView('result');
                    }}
                    className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="truncate pr-3">
                      <div className="flex items-center gap-2 text-xs text-[#785E4F] mb-0.5">
                        <span className="font-semibold text-[#C5A059]">
                          {r.product?.brand || 'Scanned Label'}
                        </span>
                        <span>·</span>
                        <span>{r.product?.marketCountry || 'Global'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors truncate">
                        {r.product?.name || 'Ingredient Text Analysis'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            r.porkCheck.status === 'PORK_DETECTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : r.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {r.porkCheck.status === 'PORK_DETECTED'
                            ? '🔴 Pork'
                            : r.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                            ? '🟡 Ambiguous'
                            : '🟢 Pork-Free'}
                        </span>
                        <span className="text-[10px] text-[#785E4F] font-mono">
                          {r.halalAnalysis.confidenceScore}% Confidence
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8A7061] group-hover:text-[#C5A059] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: UNIFIED HOME SCREEN (One place to scan and verify Halal, Gluten, Kosher, Pork, and E-Codes) */}
        {(currentView === 'home' || currentView === 'scan') && (
          <div className="space-y-6">
            {/* Front-and-Center Live Telephone Camera & Scanner */}
            <UnifiedScannerView currentLang={currentLang} />

            {/* QUICK FEATURE LAUNCHPAD (Section 1: Core Product Experience) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Launcher 1: Camera OCR */}
              <div
                onClick={() => setShowCameraScanner(true)}
                className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#2B1810] group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors">
                    Camera OCR
                  </h3>
                  <p className="text-[11px] text-[#785E4F] mt-0.5">
                    Photograph French, German, or English text
                  </p>
                </div>
              </div>

              {/* Launcher 2: Barcode Scanner */}
              <div
                onClick={() => setShowBarcodeScanner(true)}
                className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#2B1810] group-hover:scale-105 transition-transform">
                  <Barcode className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors">
                    Barcode EAN-13
                  </h3>
                  <p className="text-[11px] text-[#785E4F] mt-0.5">
                    Instant lookups for European foods
                  </p>
                </div>
              </div>

              {/* Launcher 3: E-Number Guide */}
              <div
                onClick={() => setCurrentView('additives')}
                className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#2B1810] group-hover:scale-105 transition-transform">
                  <Info className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors">
                    E-Number Guide
                  </h3>
                  <p className="text-[11px] text-[#785E4F] mt-0.5">
                    E120, E471, E441 origin analysis
                  </p>
                </div>
              </div>

              {/* Launcher 4: Travel Mode */}
              <div
                onClick={() => setShowTravelModal(true)}
                className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center text-[#2B1810] group-hover:scale-105 transition-transform">
                  <Plane className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors">
                    Travel Mode
                  </h3>
                  <p className="text-[11px] text-[#785E4F] mt-0.5">
                    France, Germany, UK, USA profiles
                  </p>
                </div>
              </div>
            </div>

            {/* RECENT SCANS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C5A059]" />
                  <h2 className="text-sm font-bold text-[#2B1810] uppercase tracking-wider">
                    {t.recentScans}
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('saved')}
                  className="text-xs text-[#785E4F] hover:text-[#2B1810] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>View All Saved</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentScans.slice(0, 3).map((res, idx) => {
                  const isPork = res.porkCheck.status === 'PORK_DETECTED';
                  const isAmbiguous = res.halalAnalysis.status === 'SOURCE_DEPENDENT';
                  const isClean = res.halalAnalysis.status === 'PLANT_BASED' || res.halalAnalysis.status === 'HALAL';

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentResult(res);
                        setCurrentView('result');
                      }}
                      className="p-4 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-[#785E4F]">
                        <span className="font-bold text-[#2B1810]">{res.product?.brand || 'Verified Food'}</span>
                        <span>{res.product?.marketCountry || 'EU'}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#2B1810] truncate">
                        {res.product?.name || 'Scanned Ingredients'}
                      </h4>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span
                          className={`font-bold ${
                            isPork ? 'text-rose-600' : isAmbiguous ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {isPork ? '🔴 Prohibited Pork' : isAmbiguous ? '🟡 Check Sourcing' : '🟢 Halal'}
                        </span>
                        <span className="text-[10px] text-[#785E4F] font-mono">
                          {res.halalAnalysis.confidenceScore}% Score
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* POPULAR VERIFIED PRODUCTS CAROUSEL (Section 36) */}
            {/* POPULAR VERIFIED PRODUCTS CAROUSEL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <h2 className="text-sm font-bold text-[#2B1810] uppercase tracking-wider">
                    {t.popularProducts} (European & International Goods)
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('search')}
                  className="text-xs text-[#785E4F] hover:text-[#2B1810] font-semibold transition-colors cursor-pointer"
                >
                  Browse Full Database
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRODUCTS_DATABASE.slice(0, 4).map((product) => {
                  const isPork = product.id.includes('chamallows') || product.id.includes('goldbaren_de') || product.id.includes('saucisse');
                  const isHalal = product.certifications[0]?.status === 'VERIFIED';

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProductBarcode(product.ean)}
                      className="p-3.5 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-[#785E4F] mb-1">
                          <span>{product.marketCountry}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isPork
                                ? 'bg-rose-100 text-rose-800'
                                : isHalal
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPork ? '🔴 Pork' : isHalal ? '🟢 Certified' : '🟡 Verify'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#2B1810] group-hover:text-[#C5A059] transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-[#785E4F]">{product.brand}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[10px] text-[#8A7061] font-mono">
                        <span>{product.ean}</span>
                        <span className="text-[#C5A059] font-bold">Scan →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HIGH-ALERT INGREDIENTS BANNER (Section 9) */}
            <div className="bg-white border border-[#E8DFD5] rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-xs font-bold text-[#2B1810] uppercase tracking-wider">
                  Top 4 Ingredients Requiring Vigilance in Europe & North America
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
                  <div className="font-bold text-rose-700 mb-0.5">Gelatin (E441)</div>
                  <p className="text-[11px] text-[#785E4F] leading-relaxed">
                    Over 70% of unspecified EU/US food gelatin is porcine (pork). Look for certified beef or fish.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
                  <div className="font-bold text-amber-700 mb-0.5">E471 (Mono/Diglycerides)</div>
                  <p className="text-[11px] text-[#785E4F] leading-relaxed">
                    Can be manufactured from plant or animal fats. Check for "vegetable origin" declaration.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
                  <div className="font-bold text-rose-700 mb-0.5">Carmine / E120</div>
                  <p className="text-[11px] text-[#785E4F] leading-relaxed">
                    Red food colouring obtained from crushed cochineal insects. Non-halal in major standards.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
                  <div className="font-bold text-amber-700 mb-0.5">Traditional Rennet</div>
                  <p className="text-[11px] text-[#785E4F] leading-relaxed">
                    Enzyme from unweaned calf stomachs. Microbial rennet is plant/fermentation safe.
                  </p>
                </div>
              </div>
            </div>

            {/* COMMUNITY FLYWHEEL CTA (Section 28) */}
            <div className="rounded-3xl bg-white border border-[#E8DFD5] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="text-sm font-bold text-[#2B1810]">Found an Unlisted Package?</h3>
                </div>
                <p className="text-xs text-[#785E4F] max-w-xl">
                  Photograph the ingredient panel with your phone camera. Our AI agent verifies and indexes new items for shoppers worldwide.
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#2B1810] hover:bg-[#3D2318] text-[#FAF7F2] font-semibold text-xs whitespace-nowrap shadow-sm transition-colors cursor-pointer"
              >
                Contribute Packaging
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-8 border-t border-[#E8DFD5] text-xs text-[#785E4F] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-[#2B1810]">Halalin'</span> · {t.tagline}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button onClick={() => setShowOfflineModal(true)} className="hover:text-[#2B1810] cursor-pointer">
            Offline Mode
          </button>
          <button onClick={() => setShowPreferencesModal(true)} className="hover:text-[#2B1810] cursor-pointer">
            Dietary Filters
          </button>
          <button onClick={() => setCurrentView('certifiers')} className="hover:text-[#2B1810] cursor-pointer">
            Certifiers
          </button>
          <button onClick={() => setCurrentView('admin')} className="hover:text-[#2B1810] cursor-pointer">
            Admin
          </button>
        </div>
      </footer>

      {/* Mobile Ergonomic Bottom Tab Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenScanModal={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedCount={savedResults.length}
        currentLang={currentLang}
      />

      {/* Interactive Modals */}
      <CameraScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onAnalyzeText={handleAnalyzeIngredientText}
        currentLang={currentLang}
      />

      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onSelectProductBarcode={handleSelectProductBarcode}
        currentLang={currentLang}
      />

      <PorkCheckModal
        isOpen={showPorkCheckModal}
        onClose={() => setShowPorkCheckModal(false)}
        currentLang={currentLang}
      />

      <TravelModeModal
        isOpen={showTravelModal}
        onClose={() => setShowTravelModal(false)}
        currentCountry={travelCountry}
        onSelectCountry={handleSelectTravelCountry}
      />

      <OfflineModeModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
      />

      <DietaryPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
      />

      {compareBaseResult && (
        <CompareModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
          baseResult={compareBaseResult}
        />
      )}

      <CommunitySubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        onSubmit={handleAddSubmission}
      />
    </div>
  );
}
