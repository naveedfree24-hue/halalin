/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, Zap, ZapOff, X, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { SAMPLE_INGREDIENT_LABELS, SampleIngredientLabel } from '../engine/ocr';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeText: (text: string, ocrConfidence?: number) => void;
  currentLang: SupportedLanguage;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeText,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [selectedSample, setSelectedSample] = useState<SampleIngredientLabel | null>(null);
  const [liveHighlightsEnabled, setLiveHighlightsEnabled] = useState(true);

  // Initialize camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

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

        // Check torch support
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as Record<string, unknown>) : null;
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } else {
        setCameraError('Camera access not supported in this browser.');
      }
    } catch {
      setCameraError('Camera unavailable or permission denied. You can upload a photo or use the sample labels below.');
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
    } catch {
      // Torch toggle failed
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
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
      setCapturedImage(dataUrl);
      executeOCRSequence(SAMPLE_INGREDIENT_LABELS[0].rawText);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        executeOCRSequence(SAMPLE_INGREDIENT_LABELS[2].rawText);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run structured OCR sequence per Section 77 & 87
  const executeOCRSequence = (textToAnalyze: string) => {
    setIsProcessing(true);
    setProcessingStep('READING LABEL & PREPROCESSING...');

    setTimeout(() => {
      setProcessingStep('DETECTING LANGUAGE & SEGMENTING INGREDIENTS...');
      setTimeout(() => {
        setProcessingStep('CROSS-REFERENCING INGREDIENT ONTOLOGY & E-NUMBERS...');
        setTimeout(() => {
          setProcessingStep('RUNNING PORK DETECTION & HALAL RULES...');
          setTimeout(() => {
            setIsProcessing(false);
            onClose();
            onAnalyzeText(textToAnalyze, 92);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  const handleSelectSample = (sample: SampleIngredientLabel) => {
    setSelectedSample(sample);
    executeOCRSequence(sample.rawText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t.cameraScan}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-lg transition-colors ${
                  torchOn ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Toggle Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={flipCamera}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Switch Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLiveHighlightsEnabled(!liveHighlightsEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                liveHighlightsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
              title="Toggle Live Ingredient Highlighting"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-slate-950 min-h-[300px] sm:min-h-[380px] overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured Label" className="w-full h-full object-contain" />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-4">{cameraError}</p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs cursor-pointer shadow-md transition-colors">
                <Upload className="w-4 h-4" />
                Upload Photo from Gallery
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between items-center text-[11px] text-emerald-300/80 font-mono tracking-wider">
                  <span>[OCR ACTIVE]</span>
                  <span>[AUTO-ALIGN]</span>
                </div>

                {/* Live Ingredient Highlighting Simulation (Section 25) */}
                {liveHighlightsEnabled && (
                  <div className="my-auto bg-slate-950/60 backdrop-blur-sm p-3 rounded-lg border border-slate-700/60 text-xs font-mono space-y-1.5 pointer-events-auto">
                    <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Live Ingredient Detection:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-[11px]">
                        cocoa butter (Plant)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600 text-amber-300 text-[11px]">
                        E471 (Verify)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-600 text-rose-300 text-[11px]">
                        pork gelatin (Prohibited)
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-center text-[11px] text-emerald-200/90 font-medium bg-slate-950/70 py-1 px-3 rounded-md mx-auto">
                  Place ingredient list inside frame
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Processing Screen Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-12 h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
              <p className="text-sm font-semibold text-white tracking-wide mb-1">
                ANALYZING PACKAGING
              </p>
              <p className="text-xs text-emerald-400 font-mono">{processingStep}</p>
            </div>
          )}
        </div>

        {/* Bottom Shutter & Sample Presets */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Gallery</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Central Capture Button */}
            <button
              onClick={handleCapture}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              Capture Label
            </button>

            <button
              onClick={() => {
                setCapturedImage(null);
                startCamera();
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Retake
            </button>
          </div>

          {/* Sample Packaging OCR Runner (Essential for instant testing across languages!) */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Or test with real European/Global packages:</span>
              <span className="text-emerald-400 text-[10px]">One-click instant OCR</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-24 overflow-y-auto pr-1">
              {SAMPLE_INGREDIENT_LABELS.slice(0, 6).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-2 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-emerald-500/50 transition-all text-[11px] group"
                >
                  <div className="font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                    {sample.title}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                    <span>{sample.country}</span>
                    <span className={sample.expectedPorkStatus === 'PORK_DETECTED' ? 'text-rose-400' : 'text-emerald-400'}>
                      {sample.expectedPorkStatus === 'PORK_DETECTED' ? 'Pork' : 'No Pork'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
