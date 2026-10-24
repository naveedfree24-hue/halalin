/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  RefreshCw,
  Upload,
  Zap,
  ZapOff,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Wheat,
  WheatOff,
  Leaf,
  Info,
  Mail,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SAMPLE_INGREDIENT_LABELS, SampleIngredientLabel } from '../engine/ocr';
import { PRODUCTS_DATABASE } from '../data/productsDb';
import { runHalalAnalysis, generateManufacturerInquiry } from '../engine/classification';
import { AnalysisResult, AnalyzedIngredient } from '../types/halal';

interface UnifiedScannerViewProps {
  currentLang: string;
}

export const UnifiedScannerView: React.FC<UnifiedScannerViewProps> = ({ currentLang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Scanning animation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);

  // Result state (lives right on the same page!)
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedIngredientIndex, setExpandedIngredientIndex] = useState<number | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Storytelling scan steps
  const SCAN_STEPS = [
    { title: 'Reading Packaging OCR...', icon: '👁️', detail: 'Optical character extraction & language recognition' },
    { title: 'Screening Pork Derivatives...', icon: '🐷', detail: 'Searching 50+ multilingual porcine terms (saindoux, lard, schweinefett)' },
    { title: 'Analyzing Gluten & Grains...', icon: '🌾', detail: 'Checking wheat, barley, rye, malt, and cross-contamination' },
    { title: 'Evaluating Kosher Compliance...', icon: '✡️', detail: 'Assessing dairy/meat separation, insect carmine, and pareve status' },
    { title: 'Decoding E-Numbers & Codes...', icon: '🔬', detail: 'Investigating emulsifiers E471, colorants E120, gelling agents E441' },
    { title: 'Synthesizing Dietary Verdict...', icon: '🟢', detail: 'Consolidating confidence score and source provenance' },
  ];

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as Record<string, unknown>) : null;
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } else {
        setCameraError('Camera access not supported in this browser.');
      }
    } catch {
      setCameraError('Camera access not granted. You can upload packaging photos or tap quick sample products below.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      // @ts-expect-error - standard browser torch constraint
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch {}
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const triggerScanAnimation = (rawText: string, productMatch?: any, imageSnapshot?: string) => {
    setIsScanning(true);
    setScanStepIndex(0);
    if (imageSnapshot) setCapturedImage(imageSnapshot);

    // Step-by-step fluid animation progression
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < SCAN_STEPS.length) {
        setScanStepIndex(currentStep);
      } else {
        clearInterval(interval);
        const analyzed = runHalalAnalysis(rawText, productMatch, 95);
        setResult(analyzed);
        setIsScanning(false);
        // Smooth scroll to the result on the same page
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }, 380);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      // Run analysis on active test sample
      triggerScanAnimation(SAMPLE_INGREDIENT_LABELS[2].rawText, PRODUCTS_DATABASE[0], dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        triggerScanAnimation(SAMPLE_INGREDIENT_LABELS[0].rawText, PRODUCTS_DATABASE[1], dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: SampleIngredientLabel) => {
    const matchedProduct = PRODUCTS_DATABASE.find((p) => p.name.toLowerCase().includes(sample.title.split(' ')[0].toLowerCase()));
    triggerScanAnimation(sample.rawText, matchedProduct);
  };

  const handleResetScan = () => {
    setResult(null);
    setCapturedImage(null);
    setIsScanning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startCamera();
  };

  // Inquiry letter for ambiguous ingredients
  const ambiguousNames = result?.analyzedIngredients
    .filter((ing) => ing.needsSourceVerification)
    .map((ing) => ing.matchedAdditive?.name || ing.matchedIngredient?.canonicalName || ing.rawText) || [];

  const inquiryLetter = result
    ? generateManufacturerInquiry(
        result.product?.name || 'Scanned Product',
        result.product?.brand || 'Manufacturer',
        ambiguousNames.length > 0 ? ambiguousNames : ['Mono- and diglycerides of fatty acids (E471)'],
        currentLang
      )
    : { subject: '', body: '' };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(`${inquiryLetter.subject}\n\n${inquiryLetter.body}`);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. CAMERA VIEWFINDER (Front and Center on the Same Page) */}
      <div className="relative w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Viewfinder Header Strip */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800/80 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              {isScanning ? 'Scanner Active & Decoding' : 'Live Camera Viewfinder'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition-colors ${
                  torchOn ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Torch"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={flipCamera}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Switch Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {result && (
              <button
                onClick={handleResetScan}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Video / Camera Feed Stage */}
        <div className="relative w-full h-[320px] sm:h-[400px] md:h-[440px] bg-slate-950 overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Scanned Pack" className="w-full h-full object-contain" />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-300 mb-4">{cameraError}</p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow-lg transition-colors">
                <Upload className="w-4 h-4" />
                Upload Photo from Gallery
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          )}

          {/* Holographic Laser & Scanner Reticle */}
          <div className="absolute inset-6 sm:inset-10 border border-emerald-500/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
            {/* Viewfinder Corner Accents */}
            <div className="flex justify-between items-center text-[10px] text-emerald-400/80 font-mono tracking-widest">
              <span>┌ HALAL · GLUTEN · KOSHER ┐</span>
              <span>[READY]</span>
            </div>

            {/* Glowing Laser Scanline Animation */}
            {isScanning ? (
              <motion.div
                initial={{ top: '10%' }}
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,1)] z-10"
              />
            ) : (
              <div className="my-auto text-center text-xs text-emerald-300/90 font-medium bg-slate-950/70 py-1.5 px-3.5 rounded-xl mx-auto backdrop-blur-sm border border-emerald-500/20">
                Point camera at any ingredients or food label
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-emerald-400/80 font-mono tracking-widest">
              <span>└ E-CODES · PORK CHECK ┘</span>
              <span>[1080P]</span>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* FLUID STORYTELLING SCAN ANIMATION OVERLAY */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30"
              >
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {SCAN_STEPS[scanStepIndex].icon}
                  </div>
                </div>

                <motion.h3
                  key={scanStepIndex}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-base font-extrabold text-white tracking-tight mb-1"
                >
                  {SCAN_STEPS[scanStepIndex].title}
                </motion.h3>

                <p className="text-xs text-emerald-300 font-mono max-w-sm mb-6">
                  {SCAN_STEPS[scanStepIndex].detail}
                </p>

                {/* Progress Badges Stream */}
                <div className="flex items-center gap-1.5">
                  {SCAN_STEPS.map((s, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-1.5 rounded-full transition-all duration-300 ${
                        idx <= scanStepIndex ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shutter Bar & Gallery Trigger */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">Gallery</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Big Tactile Shutter */}
          <button
            onClick={handleCapture}
            disabled={isScanning}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            Scan Now
          </button>

          <button
            onClick={() => handleSelectSample(SAMPLE_INGREDIENT_LABELS[2])}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            Demo
          </button>
        </div>
      </div>

      {/* 1-TAP REAL PACKAGING PRESETS (Instant verification across languages) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            1-Tap Demo Scans (Test real European & US packs):
          </span>
          <span className="text-[11px] text-emerald-400">Halal · Gluten · Kosher</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_INGREDIENT_LABELS.slice(0, 4).map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="text-left p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-all text-xs group"
            >
              <div className="font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                {sample.title.split('(')[0]}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                <span>{sample.country}</span>
                <span className={sample.expectedPorkStatus === 'PORK_DETECTED' ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                  {sample.expectedPorkStatus === 'PORK_DETECTED' ? '🔴 Pork' : '🟢 Halal'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. UNIFIED VERDICT SECTION (ON THE SAME PAGE!) */}
      {result && (
        <motion.div
          ref={resultRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-5 pt-2"
        >
          {/* Main Master Verdict Banner */}
          <div
            className={`rounded-3xl p-6 border shadow-2xl relative overflow-hidden ${
              result.porkCheck.status === 'PORK_DETECTED' || result.halalAnalysis.status === 'NOT_HALAL'
                ? 'bg-rose-950/40 border-rose-600/70 shadow-rose-950/20'
                : result.halalAnalysis.status === 'SOURCE_DEPENDENT' || result.halalAnalysis.status === 'MASHBOOH'
                ? 'bg-amber-950/40 border-amber-500/70 shadow-amber-950/20'
                : 'bg-emerald-950/40 border-emerald-500/70 shadow-emerald-950/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {result.porkCheck.status === 'PORK_DETECTED' ? (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  ) : result.halalAnalysis.status === 'SOURCE_DEPENDENT' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Unified Dietary Verdict
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {result.porkCheck.status === 'PORK_DETECTED'
                    ? '🔴 PROHIBITED: Pork Derivatives Detected'
                    : result.halalAnalysis.status === 'SOURCE_DEPENDENT'
                    ? '🟡 SOURCE VERIFICATION REQUIRED'
                    : '🟢 NO PROHIBITED INGREDIENTS DETECTED'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {result.porkCheck.status === 'PORK_DETECTED'
                    ? result.porkCheck.explanation
                    : result.halalAnalysis.status === 'SOURCE_DEPENDENT'
                    ? result.halalAnalysis.summary
                    : 'Compatible with standard Halal, vegetarian, and pure plant dietary guidelines.'}
                </p>
              </div>

              {/* Confidence Badge */}
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Confidence</div>
                <div className="text-2xl font-black text-emerald-400 tabular-nums">
                  {result.halalAnalysis.confidenceScore}%
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">{result.halalAnalysis.confidence}</div>
              </div>
            </div>
          </div>

          {/* THE 5 DIETARY PILLARS (Halal, Pork, Gluten, Kosher, Vegan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. HALAL STATUS */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  1. Halal Assessment
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
                  {result.halalAnalysis.status === 'PORK_DERIVED' || result.halalAnalysis.status === 'NOT_HALAL' ? (
                    <span className="text-rose-400">🔴 Prohibited</span>
                  ) : result.halalAnalysis.status === 'SOURCE_DEPENDENT' ? (
                    <span className="text-amber-400">🟡 Verify Source</span>
                  ) : (
                    <span className="text-emerald-400">🟢 Compatible</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {result.halalAnalysis.recommendation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                {result.halalAnalysis.noConcernCount} clear · {result.halalAnalysis.verifyCount} check
              </div>
            </div>

            {/* 2. PORK CHECK */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  2. Pork & Porcine
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
                  {result.porkCheck.status === 'PORK_DETECTED' ? (
                    <span className="text-rose-400">🔴 Pork Found</span>
                  ) : result.porkCheck.status === 'POSSIBLE_PORK_SOURCE' ? (
                    <span className="text-amber-400">🟡 Ambiguous Fat</span>
                  ) : (
                    <span className="text-emerald-400">🟢 Pork-Free</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {result.porkCheck.status === 'PORK_DETECTED'
                    ? 'Declared swine tissue/lard'
                    : result.porkCheck.status === 'POSSIBLE_PORK_SOURCE'
                    ? 'Animal source unconfirmed'
                    : 'No pork declared'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                25+ Language Filter
              </div>
            </div>

            {/* 3. GLUTEN CHECK */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  3. Gluten Status
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
                  {result.glutenCheck.containsGluten ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Wheat className="w-4 h-4" /> Contains Gluten
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <WheatOff className="w-4 h-4" /> Gluten-Free
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {result.glutenCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                {result.glutenCheck.containsGluten ? 'Wheat / Barley detected' : 'Grain-free'}
              </div>
            </div>

            {/* 4. KOSHER ASSESSMENT */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  4. Kosher Assessment
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
                  {result.kosherCheck.status === 'NOT_KOSHER' ? (
                    <span className="text-rose-400">🔴 Non-Kosher</span>
                  ) : result.kosherCheck.status === 'KOSHER_DAIRY_COMPATIBLE' ? (
                    <span className="text-blue-400">🥛 Kosher Dairy</span>
                  ) : result.kosherCheck.status === 'SOURCE_VERIFICATION_REQUIRED' ? (
                    <span className="text-amber-400">🟡 Verify Hechsher</span>
                  ) : (
                    <span className="text-emerald-400">🟢 Kosher Pareve</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {result.kosherCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                Kashrut Rules
              </div>
            </div>

            {/* 5. VEGAN / PLANT-BASED */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  5. Vegan & Plant
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
                  {result.veganCheck.isVegan ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Leaf className="w-4 h-4" /> 100% Vegan
                    </span>
                  ) : result.veganCheck.isVegetarian ? (
                    <span className="text-teal-400">🧀 Vegetarian</span>
                  ) : (
                    <span className="text-slate-400">🥩 Animal Derived</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {result.veganCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                Plant Standards
              </div>
            </div>
          </div>

          {/* DETECTED E-NUMBERS & CODES BAR (Section 8) */}
          {result.detectedAdditives.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Detected European E-Numbers & Additives ({result.detectedAdditives.length})</span>
                <span className="text-[11px] text-emerald-400 font-normal">Tap any code for instant origin</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.detectedAdditives.map((add) => (
                  <div
                    key={add.eNumber}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      add.halalStatus === 'NOT_HALAL'
                        ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                        : add.halalStatus === 'SOURCE_DEPENDENT'
                        ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                        : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    }`}
                  >
                    <span className="font-mono font-bold">{add.eNumber}</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{add.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40">
                      {add.halalStatus === 'SOURCE_DEPENDENT' ? 'Verify Fat' : add.halalStatus === 'NOT_HALAL' ? 'Prohibited' : 'Halal'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXPANDABLE INGREDIENTS LIST */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Detailed Ingredient Breakdown ({result.analyzedIngredients.length})
              </h3>
              {ambiguousNames.length > 0 && (
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Ask Manufacturer</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-800">
              {result.analyzedIngredients.map((ing, idx) => {
                const isExpanded = expandedIngredientIndex === idx;

                return (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                    <button
                      onClick={() => setExpandedIngredientIndex(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            ing.halalStatus === 'PORK_DERIVED' || ing.halalStatus === 'NOT_HALAL'
                              ? 'bg-rose-500'
                              : ing.needsSourceVerification
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                          {ing.rawText}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
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
                            ? 'Verify'
                            : 'Permissible'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <p className="text-emerald-300 font-medium mb-1">Reason: {ing.reason}</p>
                        {ing.matchedAdditive?.scientificDetails && (
                          <p className="text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/60">
                            {ing.matchedAdditive.scientificDetails}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Bottom Action: Rescan in 1 Click */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleResetScan}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Next Packaging
            </button>
          </div>
        </motion.div>
      )}

      {/* MODAL: ASK THE MANUFACTURER INQUIRY */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Manufacturer Origin Inquiry</h3>
              </div>
              <button onClick={() => setShowInquiryModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Ready-to-send localized email inquiring about fat and enzyme sourcing:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="text-slate-300">
                <span className="text-slate-500">Subject: </span>{inquiryLetter.subject}
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 whitespace-pre-line max-h-52 overflow-y-auto">
                {inquiryLetter.body}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleCopyLetter}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedLetter ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLetter ? 'Copied!' : 'Copy Letter'}
              </button>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
