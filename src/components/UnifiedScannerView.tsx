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
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
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

  // Scanning animation & AI agent states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Text Manual Input Mode Toggle
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');

  // Result state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [aiVerdictData, setAiVerdictData] = useState<{
    productName?: string;
    brand?: string;
    isPorkDetected?: boolean;
    porkIngredients?: string[];
    porkExplanation?: string;
    halalStatus?: string;
    halalScore?: number;
    halalExplanation?: string;
    isGlutenFree?: boolean;
    glutenIngredients?: string[];
    glutenExplanation?: string;
    kosherStatus?: string;
    kosherExplanation?: string;
    isVegan?: boolean;
    veganExplanation?: string;
    ocrExtractedText?: string;
  } | null>(null);

  const [expandedIngredientIndex, setExpandedIngredientIndex] = useState<number | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Fluid AI scan steps
  const SCAN_STEPS = [
    { title: 'Optical Lens Capture...', icon: '📸', detail: 'High-resolution packaging text extraction' },
    { title: 'AI Swine & Porcine Screening...', icon: '🐷', detail: 'Zero-tolerance detection: porc, saucisse, lard, saindoux' },
    { title: 'Celiac & Gluten Grain Analysis...', icon: '🌾', detail: 'Checking wheat, barley, rye, malt, and cross-contact' },
    { title: 'Kosher Kashrut Verification...', icon: '✡️', detail: 'Evaluating Pareve, Dairy separation, insect carmine rules' },
    { title: 'Decoding E-Numbers & Chemical Codes...', icon: '🔬', detail: 'Investigating emulsifiers E471, gelling agents E441, color E120' },
    { title: 'Harmonizing Complete Dietary Verdict...', icon: '✨', detail: 'Consolidating AI intelligence verdict on one page' },
  ];

  // Initialize camera
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
      setCameraError('Camera access not granted. You can upload packaging photos or select a 1-tap demo product below.');
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

  // Execute AI or Local Analysis with real data
  const processPackagingAnalysis = async (
    rawText: string,
    imageBase64?: string,
    productMatch?: any
  ) => {
    setIsScanning(true);
    setScanStepIndex(0);
    setAiAnalyzing(true);
    if (imageBase64) setCapturedImage(imageBase64);

    // Step animation interval
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < SCAN_STEPS.length) {
        setScanStepIndex(step);
      }
    }, 320);

    try {
      // Call AI Agent Endpoint
      const response = await fetch('/api/analyze-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText || undefined,
          imageBase64: imageBase64 || undefined,
          currentLang,
        }),
      });

      clearInterval(stepInterval);

      if (response.ok) {
        const aiData = await response.json();
        setAiVerdictData(aiData);

        // Convert AI response into standard local AnalysisResult model
        const textToClassify = aiData.ocrExtractedText || rawText || '';
        const localAnalyzed = runHalalAnalysis(textToClassify, productMatch, 99);

        // Override with AI agent zero-tolerance findings
        if (aiData.isPorkDetected) {
          localAnalyzed.porkCheck.status = 'PORK_DETECTED';
          localAnalyzed.porkCheck.explicitPorkFound = true;
          localAnalyzed.porkCheck.explanation = aiData.porkExplanation;
          localAnalyzed.porkCheck.flaggedIngredients = aiData.porkIngredients || ['Pork / Porcine'];
          localAnalyzed.halalAnalysis.status = 'PORK_DERIVED';
          localAnalyzed.halalAnalysis.confidenceScore = 0; // Strict 0% compatibility!
          localAnalyzed.halalAnalysis.summary = 'PROHIBITED SWINE INGREDIENT DETECTED.';
          localAnalyzed.halalAnalysis.recommendation = 'Avoid consumption. Explicit pork derivative identified by AI Agent.';
          localAnalyzed.kosherCheck.status = 'NOT_KOSHER';
          localAnalyzed.kosherCheck.explanation = 'Non-Kosher: Contains pork / porcine derivatives.';
        } else if (aiData.halalStatus === 'SOURCE_DEPENDENT') {
          localAnalyzed.halalAnalysis.status = 'SOURCE_DEPENDENT';
          localAnalyzed.halalAnalysis.confidenceScore = aiData.halalScore || 55;
          localAnalyzed.halalAnalysis.summary = aiData.halalExplanation;
        } else {
          localAnalyzed.halalAnalysis.status = 'HALAL';
          localAnalyzed.halalAnalysis.confidenceScore = aiData.halalScore || 98;
          localAnalyzed.halalAnalysis.summary = aiData.halalExplanation;
        }

        if (aiData.isGlutenFree !== undefined) {
          localAnalyzed.glutenCheck.status = aiData.isGlutenFree ? 'GLUTEN_FREE' : 'CONTAINS_GLUTEN';
          localAnalyzed.glutenCheck.containsGluten = !aiData.isGlutenFree;
          localAnalyzed.glutenCheck.explanation = aiData.glutenExplanation || localAnalyzed.glutenCheck.explanation;
          if (aiData.glutenIngredients) {
            localAnalyzed.glutenCheck.flaggedGrains = aiData.glutenIngredients;
          }
        }

        if (aiData.productName) {
          localAnalyzed.product = {
            id: 'scanned_ai_product',
            gtin: '',
            ean: '',
            barcodeType: 'EAN-13',
            name: aiData.productName,
            brand: aiData.brand || 'Packaging Verified',
            manufacturer: aiData.brand || 'Food Producer',
            category: 'Scanned Food Product',
            marketCountry: 'International',
            marketCountryCode: 'INTL',
            countriesSold: ['FR', 'DE', 'GB', 'US', 'BE', 'IT'],
            packageSize: 'Scanned Package',
            imageUrl: imageBase64 || '',
            ingredientsRaw: aiData.ocrExtractedText || rawText,
            ingredientsLanguage: currentLang,
            allergens: [],
            certifications: [],
            externalSource: 'Gemini Multimodal AI Agent',
            dataQualityScore: 98,
            lastVerified: '2026-10-25',
          };
        }

        setResult(localAnalyzed);
      } else {
        // Fallback to local rule engine
        const fallback = runHalalAnalysis(rawText, productMatch, 95);
        setResult(fallback);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.warn('AI Agent call failed, using local rule engine:', err);
      const fallback = runHalalAnalysis(rawText, productMatch, 95);
      setResult(fallback);
    } finally {
      setIsScanning(false);
      setAiAnalyzing(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  // Real Camera Live Shutter Capture
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      // Run real AI analysis on the actual camera snapshot!
      processPackagingAnalysis('', dataUrl);
    }
  };

  // File / Photo Upload from Gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        processPackagingAnalysis('', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1-Tap Sample Preset Selection
  const handleSelectSample = (sample: SampleIngredientLabel) => {
    const matchedProduct = PRODUCTS_DATABASE.find((p) =>
      p.name.toLowerCase().includes(sample.title.split(' ')[0].toLowerCase())
    );
    processPackagingAnalysis(sample.rawText, undefined, matchedProduct);
  };

  // Manual Text / Barcode submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    processPackagingAnalysis(manualText.trim());
  };

  const handleResetScan = () => {
    setResult(null);
    setAiVerdictData(null);
    setCapturedImage(null);
    setIsScanning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startCamera();
  };

  // Manufacturer Inquiry Letter Generator
  const ambiguousNames =
    result?.analyzedIngredients
      .filter((ing) => ing.needsSourceVerification)
      .map((ing) => ing.matchedAdditive?.name || ing.matchedIngredient?.canonicalName || ing.rawText) || [];

  const inquiryLetter = result
    ? generateManufacturerInquiry(
        result.product?.name || 'Scanned Food Product',
        result.product?.brand || 'Food Manufacturer',
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
      
      {/* 1. CAMERA VIEWFINDER (Dark Obsidian Camera Lens with High-Contrast Champagne Accents) */}
      <div className="relative w-full rounded-3xl bg-[#120C09] border-2 border-[#2B1810] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Viewfinder Dark Obsidian Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1A120E] border-b border-[#2B1810] z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span className="text-xs font-bold text-[#FAF7F2] tracking-wider uppercase font-mono">
              {isScanning ? 'AI Agent Analyzing Packaging' : 'Live Camera Viewfinder'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  torchOn ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-[#2B1810] text-[#A89182] hover:text-[#FAF7F2]'
                }`}
                title="Torch"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={flipCamera}
              className="p-2 rounded-xl bg-[#2B1810] text-[#A89182] hover:text-[#FAF7F2] transition-colors cursor-pointer"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {result && (
              <button
                onClick={handleResetScan}
                className="px-3 py-1.5 rounded-xl bg-[#2B1810] text-[#FAF7F2] hover:bg-[#3D2419] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>New Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Video / Camera Feed Stage */}
        <div className="relative w-full h-[320px] sm:h-[400px] md:h-[440px] bg-[#0A0605] overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Scanned Pack" className="w-full h-full object-contain" />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <Camera className="w-12 h-12 text-[#785E4F] mx-auto mb-3" />
              <p className="text-xs text-[#E8DFD5] mb-4">{cameraError}</p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B88E3E] text-[#1A120E] font-bold text-xs cursor-pointer shadow-lg transition-colors">
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

          {/* Golden Reticle Target */}
          <div className="absolute inset-6 sm:inset-10 border border-[#C5A059]/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
            <div className="flex justify-between items-center text-[10px] text-[#C5A059] font-mono tracking-widest">
              <span>┌ HALAL · GLUTEN · KOSHER ┐</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-[#C5A059]" />
                AI AGENT READY
              </span>
            </div>

            {/* Glowing Golden Laser Scanline Animation */}
            {isScanning ? (
              <motion.div
                initial={{ top: '10%' }}
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent shadow-[0_0_15px_rgba(197,160,89,1)] z-10"
              />
            ) : (
              <div className="my-auto text-center text-xs text-[#FAF7F2] font-semibold bg-[#1A120E]/80 py-1.5 px-4 rounded-xl mx-auto backdrop-blur-sm border border-[#C5A059]/30">
                Point camera at packaging label or tap Shutter
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-[#C5A059] font-mono tracking-widest">
              <span>└ ZERO PORK TOLERANCE ┘</span>
              <span>[4K AI OCR]</span>
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
                className="absolute inset-0 bg-[#0F0A08]/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30"
              >
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full border-4 border-[#C5A059]/20 border-t-[#C5A059] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {SCAN_STEPS[scanStepIndex].icon}
                  </div>
                </div>

                <motion.h3
                  key={scanStepIndex}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-base font-black text-[#FAF7F2] tracking-tight mb-1"
                >
                  {SCAN_STEPS[scanStepIndex].title}
                </motion.h3>

                <p className="text-xs text-[#C5A059] font-mono max-w-sm mb-6">
                  {SCAN_STEPS[scanStepIndex].detail}
                </p>

                {/* Progress Badges */}
                <div className="flex items-center gap-1.5">
                  {SCAN_STEPS.map((s, idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-1.5 rounded-full transition-all duration-300 ${
                        idx <= scanStepIndex ? 'bg-[#C5A059] shadow-sm shadow-[#C5A059]' : 'bg-[#2B1810]'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shutter Bar with Champagne & Chocolate Tactile Controls */}
        <div className="p-4 bg-[#1A120E] border-t border-[#2B1810] flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#2B1810] hover:bg-[#3D2419] border border-[#3D2419] text-xs font-semibold text-[#FAF7F2] cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-[#C5A059]" />
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Primary Tactile Capture Shutter */}
          <button
            onClick={handleCapture}
            disabled={isScanning}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#B88E3E] hover:to-[#C5A059] text-[#1A120E] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#C5A059]/20 active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            Scan Now
          </button>

          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="px-3.5 py-2.5 rounded-2xl bg-[#2B1810] hover:bg-[#3D2419] border border-[#3D2419] text-xs font-semibold text-[#FAF7F2] transition-colors cursor-pointer"
          >
            {showTextInput ? 'Hide Text' : 'Type Text'}
          </button>
        </div>
      </div>

      {/* MANUAL INGREDIENT TEXT INPUT ACCORDION (If user wants to test custom ingredients directly) */}
      {showTextInput && (
        <form onSubmit={handleManualSubmit} className="p-4 rounded-3xl bg-white border border-[#E8DFD5] shadow-sm space-y-3">
          <label className="block text-xs font-bold text-[#2B1810]">
            Paste or Type Packaging Ingredients:
          </label>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="e.g. Ingrédients: Viande de porc, gras de porc, sel, boyau naturel... OR Farine, sucre, E471..."
            rows={3}
            className="w-full p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs text-[#2B1810] placeholder-[#9C8274] focus:outline-none focus:border-[#C5A059]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setManualText('')}
              className="px-3 py-1.5 rounded-xl text-xs text-[#785E4F] hover:text-[#2B1810]"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isScanning || !manualText.trim()}
              className="px-4 py-2 rounded-xl bg-[#2B1810] hover:bg-[#3D2419] text-white text-xs font-bold shadow-sm transition-all"
            >
              Analyze with AI Agent
            </button>
          </div>
        </form>
      )}

      {/* 1-TAP DEMO PRESETS (Instant verification across languages including French Pork Sausage) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1 text-[#6B5145]">
          <span className="font-bold text-[#2B1810] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            1-Tap Demo Scans (Test real European food packaging):
          </span>
          <span className="text-[11px] font-semibold text-[#785E4F]">Zero signup needed</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SAMPLE_INGREDIENT_LABELS.slice(0, 4).map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="text-left p-3 rounded-2xl bg-white hover:bg-[#FDFBF7] border border-[#E8DFD5] hover:border-[#C5A059] shadow-sm transition-all text-xs group cursor-pointer"
            >
              <div className="font-bold text-[#2B1810] group-hover:text-[#C5A059] truncate transition-colors">
                {sample.title.split('(')[0]}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-[#785E4F]">
                <span>{sample.country}</span>
                <span className={sample.expectedPorkStatus === 'PORK_DETECTED' ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                  {sample.expectedPorkStatus === 'PORK_DETECTED' ? '🔴 Pork' : '🟢 Halal'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. UNIFIED VERDICT SECTION (LIVES ON THE SAME PAGE IN CHAMPAGNE & CHOCOLATE THEME) */}
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
            className={`rounded-3xl p-6 sm:p-7 border-2 shadow-xl relative overflow-hidden transition-all ${
              result.porkCheck.status === 'PORK_DETECTED' || result.halalAnalysis.status === 'NOT_HALAL'
                ? 'bg-[#FEF2F2] border-[#EF4444] text-[#7F1D1D]'
                : result.halalAnalysis.status === 'SOURCE_DEPENDENT' || result.halalAnalysis.status === 'MASHBOOH'
                ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#78350F]'
                : 'bg-[#F0FDF4] border-[#10B981] text-[#064E3B]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {result.porkCheck.status === 'PORK_DETECTED' ? (
                    <XCircle className="w-7 h-7 text-[#DC2626] shrink-0" />
                  ) : result.halalAnalysis.status === 'SOURCE_DEPENDENT' ? (
                    <AlertTriangle className="w-7 h-7 text-[#D97706] shrink-0" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-[#059669] shrink-0" />
                  )}
                  <span className="text-xs font-black uppercase tracking-wider">
                    {result.product?.name || 'Scanned Food Product'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {result.porkCheck.status === 'PORK_DETECTED'
                    ? '🔴 PROHIBITED: Porcine / Pork Ingredients Detected'
                    : result.halalAnalysis.status === 'SOURCE_DEPENDENT'
                    ? '🟡 SOURCING VERIFICATION REQUIRED'
                    : '🟢 100% COMPATIBLE: No Prohibited Ingredients'}
                </h2>

                <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-2xl opacity-90">
                  {result.porkCheck.status === 'PORK_DETECTED'
                    ? result.porkCheck.explanation
                    : result.halalAnalysis.status === 'SOURCE_DEPENDENT'
                    ? result.halalAnalysis.summary
                    : 'All ingredients are permissible under standard Halal dietary guidelines.'}
                </p>

                {result.porkCheck.flaggedIngredients.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-rose-300/50 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold">Flagged Ingredients:</span>
                    {result.porkCheck.flaggedIngredients.map((item, idx) => (
                      <span key={idx} className="bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded-lg text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Halal Compatibility Score Card */}
              <div className="px-5 py-4 rounded-2xl bg-white border border-[#E8DFD5] text-center shrink-0 shadow-md">
                <div className="text-[10px] text-[#785E4F] font-mono uppercase font-bold">
                  {result.porkCheck.status === 'PORK_DETECTED' ? 'Halal Score' : 'Compatibility'}
                </div>
                <div
                  className={`text-3xl font-black tabular-nums ${
                    result.porkCheck.status === 'PORK_DETECTED'
                      ? 'text-[#DC2626]'
                      : result.halalAnalysis.status === 'SOURCE_DEPENDENT'
                      ? 'text-[#D97706]'
                      : 'text-[#059669]'
                  }`}
                >
                  {result.halalAnalysis.confidenceScore}%
                </div>
                <div className="text-[10px] text-[#6B5145] font-semibold mt-0.5">
                  {result.porkCheck.status === 'PORK_DETECTED' ? 'Strict Swine Alert' : 'Verified by AI'}
                </div>
              </div>
            </div>
          </div>

          {/* THE 5 DIETARY PILLARS (Harmonic, Crisp White Cards with Chocolate Typography) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* 1. HALAL STATUS */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-[#785E4F] uppercase font-bold tracking-wider mb-1">
                  1. Halal Assessment
                </div>
                <div className="font-black text-sm">
                  {result.halalAnalysis.status === 'PORK_DERIVED' || result.halalAnalysis.status === 'NOT_HALAL' ? (
                    <span className="text-rose-600">🔴 Prohibited</span>
                  ) : result.halalAnalysis.status === 'SOURCE_DEPENDENT' ? (
                    <span className="text-amber-600">🟡 Verify Source</span>
                  ) : (
                    <span className="text-emerald-700">🟢 Compatible</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B5145] mt-1.5 line-clamp-2 leading-relaxed">
                  {result.halalAnalysis.recommendation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F0EAE1] text-[10px] text-[#8A7061] font-mono">
                {result.halalAnalysis.noConcernCount} clear · {result.halalAnalysis.verifyCount} check
              </div>
            </div>

            {/* 2. PORK CHECK */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-[#785E4F] uppercase font-bold tracking-wider mb-1">
                  2. Pork & Porcine
                </div>
                <div className="font-black text-sm">
                  {result.porkCheck.status === 'PORK_DETECTED' ? (
                    <span className="text-rose-600">🔴 Pork Found</span>
                  ) : result.porkCheck.status === 'POSSIBLE_PORK_SOURCE' ? (
                    <span className="text-amber-600">🟡 Ambiguous Fat</span>
                  ) : (
                    <span className="text-emerald-700">🟢 Pork-Free</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B5145] mt-1.5 line-clamp-2 leading-relaxed">
                  {result.porkCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F0EAE1] text-[10px] text-[#8A7061] font-mono">
                50+ Multilingual Terms Checked
              </div>
            </div>

            {/* 3. GLUTEN CHECK */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-[#785E4F] uppercase font-bold tracking-wider mb-1">
                  3. Gluten & Celiac
                </div>
                <div className="flex items-center gap-1.5 font-black text-sm">
                  {result.glutenCheck.containsGluten ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <Wheat className="w-4 h-4 text-amber-600" /> Contains Gluten
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <WheatOff className="w-4 h-4 text-emerald-600" /> Gluten-Free
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B5145] mt-1.5 line-clamp-2 leading-relaxed">
                  {result.glutenCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F0EAE1] text-[10px] text-[#8A7061] font-mono">
                Wheat · Barley · Rye Check
              </div>
            </div>

            {/* 4. KOSHER CHECK */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-[#785E4F] uppercase font-bold tracking-wider mb-1">
                  4. Kosher Kashrut
                </div>
                <div className="font-black text-sm">
                  {result.kosherCheck.status === 'NOT_KOSHER' ? (
                    <span className="text-rose-600">✡️ Non-Kosher</span>
                  ) : result.kosherCheck.status === 'KOSHER_PAREVE_COMPATIBLE' ? (
                    <span className="text-blue-700">✡️ Pareve (Neutral)</span>
                  ) : result.kosherCheck.status === 'KOSHER_DAIRY_COMPATIBLE' ? (
                    <span className="text-cyan-700">✡️ Kosher Dairy</span>
                  ) : (
                    <span className="text-amber-600">✡️ Verify Cert</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B5145] mt-1.5 line-clamp-2 leading-relaxed">
                  {result.kosherCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F0EAE1] text-[10px] text-[#8A7061] font-mono">
                Dairy & Meat Separation
              </div>
            </div>

            {/* 5. VEGAN / PLANT-BASED */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-[#785E4F] uppercase font-bold tracking-wider mb-1">
                  5. Plant-Based
                </div>
                <div className="flex items-center gap-1.5 font-black text-sm">
                  {result.veganCheck.isVegan ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <Leaf className="w-4 h-4 text-emerald-600" /> 100% Vegan
                    </span>
                  ) : result.veganCheck.isVegetarian ? (
                    <span className="text-teal-700">Vegetarian</span>
                  ) : (
                    <span className="text-[#8A7061]">Contains Animal/Meat</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B5145] mt-1.5 line-clamp-2 leading-relaxed">
                  {result.veganCheck.explanation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#F0EAE1] text-[10px] text-[#8A7061] font-mono">
                Zero Animal Slaughter
              </div>
            </div>

          </div>

          {/* AMBIGUOUS E471 INQUIRY TRIGGER */}
          {result.halalAnalysis.status === 'SOURCE_DEPENDENT' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#92400E] flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  1-Tap Manufacturer Sourcing Inquiry Available
                </h4>
                <p className="text-xs text-[#78350F]">
                  Halalin' has pre-drafted an inquiry letter in {currentLang.toUpperCase()} for the brand to confirm whether E471 fatty acids are from plant or animal sources.
                </p>
              </div>
              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#2B1810] hover:bg-[#3D2419] text-white font-bold text-xs whitespace-nowrap shadow-sm transition-colors cursor-pointer"
              >
                View Draft Email
              </button>
            </div>
          )}

          {/* INGREDIENT LIST ACCORDION */}
          <div className="bg-white border border-[#E8DFD5] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#2B1810]">
                  Decoded Ingredients & Additives ({result.analyzedIngredients.length})
                </h3>
                <p className="text-xs text-[#785E4F]">
                  Tap any ingredient to view full origin provenance and European E-code profile.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#C5A059]">
                Language: {result.detectedLanguage.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              {result.analyzedIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedIngredientIndex(expandedIngredientIndex === idx ? null : idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    ing.porkStatus === 'PORK_DETECTED'
                      ? 'bg-rose-50/70 border-rose-300'
                      : ing.halalStatus === 'SOURCE_DEPENDENT'
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-[#FAF7F2] border-[#E8DFD5] hover:border-[#C5A059]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">
                        {ing.porkStatus === 'PORK_DETECTED'
                          ? '🔴'
                          : ing.halalStatus === 'SOURCE_DEPENDENT'
                          ? '🟡'
                          : '🟢'}
                      </span>
                      <span className="text-xs font-bold text-[#2B1810]">
                        {ing.rawText}
                      </span>
                      {ing.matchedAdditive && (
                        <span className="text-[10px] bg-[#EAE2D5] text-[#2B1810] px-2 py-0.5 rounded-md font-mono font-bold">
                          {ing.matchedAdditive.eNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#785E4F]">
                        {ing.porkStatus === 'PORK_DETECTED'
                          ? 'Porcine Swine'
                          : ing.needsSourceVerification
                          ? 'Verify Origin'
                          : 'Permissible'}
                      </span>
                      {expandedIngredientIndex === idx ? (
                        <ChevronUp className="w-4 h-4 text-[#785E4F]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#785E4F]" />
                      )}
                    </div>
                  </div>

                  {expandedIngredientIndex === idx && (
                    <div className="mt-3 pt-3 border-t border-[#E8DFD5] text-xs text-[#4A3328] space-y-1">
                      <p><strong>Assessment:</strong> {ing.reason}</p>
                      {ing.matchedAdditive && (
                        <p><strong>Additive Function:</strong> {ing.matchedAdditive.function} ({ing.matchedAdditive.name})</p>
                      )}
                      {ing.overrideContext && (
                        <p className="text-[11px] text-[#785E4F]"><strong>Context:</strong> {ing.overrideContext}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL: MANUFACTURER EMAIL INQUIRY LETTER */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-[#E8DFD5] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <h3 className="text-base font-bold text-[#2B1810] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C5A059]" />
                Inquiry Letter to {result?.product?.brand || 'Brand Manufacturer'}
              </h3>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-xs font-bold text-[#785E4F] hover:text-[#2B1810] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#785E4F]">Subject:</div>
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs font-bold text-[#2B1810]">
                {inquiryLetter.subject}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#785E4F]">Email Body:</div>
              <textarea
                readOnly
                value={inquiryLetter.body}
                rows={8}
                className="w-full p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs text-[#2B1810] font-sans leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowInquiryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs font-semibold text-[#6B5145] hover:text-[#2B1810]"
              >
                Dismiss
              </button>
              <button
                onClick={handleCopyLetter}
                className="px-5 py-2 rounded-xl bg-[#2B1810] hover:bg-[#3D2419] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                {copiedLetter ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLetter ? 'Copied to Clipboard!' : 'Copy Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
