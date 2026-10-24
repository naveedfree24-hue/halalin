/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Barcode, Search, X, Check, Camera, AlertCircle } from 'lucide-react';
import { PRODUCTS_DATABASE } from '../data/productsDb';
import { detectBarcodeFromCanvas } from '../engine/ocr';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductBarcode: (barcode: string) => void;
  currentLang: SupportedLanguage;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProductBarcode,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCameraActive(false);
      return;
    }

    // Try starting video for barcode detection
    let isMounted = true;
    const startScanner = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (!isMounted) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }
          setStream(mediaStream);
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        }
      } catch {
        setCameraActive(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Periodic barcode scan check
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const detected = await detectBarcodeFromCanvas(canvas);
            if (detected) {
              clearInterval(interval);
              onClose();
              onSelectProductBarcode(detected);
            }
          }
        }
      }
    }, 600);

    return () => clearInterval(interval);
  }, [cameraActive, onClose, onSelectProductBarcode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onClose();
      onSelectProductBarcode(manualCode.trim());
    }
  };

  const handleQuickPick = (ean: string) => {
    onClose();
    onSelectProductBarcode(ean);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t.barcodeScan}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Target */}
        <div className="relative bg-slate-950 h-52 sm:h-60 overflow-hidden flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Align barcode in viewfinder or choose a test barcode below
              </p>
            </div>
          )}

          {/* Barcode Laser Overlay */}
          <div className="absolute inset-x-8 inset-y-6 sm:inset-x-12 sm:inset-y-10 border-2 border-emerald-500/50 rounded-lg pointer-events-none flex flex-col justify-between">
            <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-bounce my-auto" />
            <div className="text-center text-[10px] text-emerald-300 font-mono pb-1 bg-slate-950/60">
              EAN-13 / UPC / GTIN / QR
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Manual Barcode Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Enter barcode number (e.g. 8000500310427)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Lookup
            </button>
          </form>

          {/* Popular Real Barcode Presets */}
          <div>
            <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick-Test Verified European & US Barcodes:</span>
              <span className="text-emerald-400 text-[10px]">Instant Result</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {PRODUCTS_DATABASE.map((product) => {
                const isPork = product.id.includes('chamallows') || product.id.includes('goldbaren_de');
                const isHalal = product.certifications[0]?.status === 'VERIFIED';
                return (
                  <button
                    key={product.id}
                    onClick={() => handleQuickPick(product.ean)}
                    className="text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-slate-200 truncate">{product.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{product.ean}</div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        isPork
                          ? 'bg-rose-950 border border-rose-800 text-rose-300'
                          : isHalal
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          : 'bg-amber-950 border border-amber-800 text-amber-300'
                      }`}
                    >
                      {isPork ? '🔴 Pork' : isHalal ? '🟢 Halal' : '🟡 Verify'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
