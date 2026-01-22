import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from '../state/ThemeContext';

export default function AdmissionScanner({ onScan, onClose }) {
  const { isDark } = useTheme();
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [view, setView] = useState('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  
  const scanLock = useRef(false);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    if (view === 'camera') {
      startCamera();
    }

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = (decodedText) => {
    if (scanLock.current) return;
    
    scanLock.current = true;
    setLastScanned(decodedText);
    onScan(decodedText);

    setTimeout(() => {
      scanLock.current = false;
    }, 1500);
  };

  const startCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) return;
      
      // Responsive QR box sizing
      const qrBoxSize = window.innerWidth < 640 ? 200 : 250;

      await scannerRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 20, 
          qrbox: { width: qrBoxSize, height: qrBoxSize }, 
          aspectRatio: 1.0 
        },
        (text) => handleScanSuccess(text),
        () => {} 
      );
    } catch (err) {
      console.error("Camera failed:", err);
    }
  };

  const switchToUpload = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setView('file');
  };

  const switchToCamera = async () => {
    setView('camera');
    setTimeout(() => startCamera(), 150);
  };

  const processFile = async (file) => {
    if (!file || !scannerRef.current || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await scannerRef.current.scanFileV2(file, true);
      if (result && result.decodedText) {
        handleScanSuccess(result.decodedText);
      }
    } catch (err) {
      console.error("Scan error:", err);
      alert("לא נמצא ברקוד בתמונה. נא לוודא שהתמונה ברורה.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className={`relative rounded-[30px] sm:rounded-[40px] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col min-h-125 sm:min-h-137.5 animate-in zoom-in duration-300 transition-colors ${
        isDark ? 'bg-slate-900 border border-white/5' : 'bg-white'
      }`}>
        
        {/* Close Button - Larger touch target for mobile */}
        <button onClick={onClose} className="absolute top-4 right-6 sm:top-6 sm:left-8 text-slate-400 hover:text-rose-500 text-2xl sm:text-3xl transition-colors p-2">✕</button>
        
        <div className="text-center mb-4 sm:mb-6 mt-4 sm:mt-0">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border-2 transition-colors ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <span className="text-xl sm:text-2xl">{view === 'camera' ? '📸' : '📁'}</span>
          </div>
          <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            סריקה רציפה
          </h3>
          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {view === 'camera' ? 'כוון את המצלמה לברקוד' : 'העלאת תמונות ברקוד'}
          </p>
        </div>

        {/* Camera View Area */}
        <div className={`relative rounded-2xl sm:rounded-[30px] overflow-hidden border-2 sm:border-4 bg-black aspect-square mb-4 sm:mb-6 shadow-inner transition-colors ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        } ${view === 'camera' ? 'block' : 'hidden'}`}>
          <div id="reader" className="w-full h-full"></div>
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 shadow-[0_0_20px_#10b981] z-20 animate-scan-line"></div>
          
          {/* Success Overlay */}
          {scanLock.current && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center z-30 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-full p-3 sm:p-4 shadow-2xl scale-110 animate-bounce">
                    <span className="text-3xl sm:text-4xl">✅</span>
                </div>
            </div>
          )}
        </div>

        {/* File Upload View Area */}
        {view === 'file' && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => !isProcessing && fileInputRef.current.click()}
            className={`relative rounded-2xl sm:rounded-[30px] border-2 sm:border-4 border-dashed aspect-square mb-4 sm:mb-6 flex flex-col items-center justify-center transition-all cursor-pointer group ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' 
                : isDark 
                  ? 'border-slate-700 bg-slate-800/50' 
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>מנתח...</span>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="text-4xl sm:text-5xl mb-3">📥</div>
                <p className={`font-black text-lg sm:text-xl ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>לחץ לבחירה</p>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase hidden sm:block">או גרור קובץ לכאן</p>
              </div>
            )}
            
            {lastScanned && !isProcessing && (
                <div className="absolute bottom-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-black">
                    נסרק: {lastScanned}
                </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-auto space-y-2 sm:space-y-3">
          <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} accept="image/*" className="hidden" />
          
          {view === 'camera' ? (
            <button onClick={switchToUpload} className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg ${
              isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}>
              <span>📂</span> העלאת ברקוד
            </button>
          ) : (
            <button onClick={switchToCamera} className="w-full border-2 sm:border-4 border-emerald-500 text-emerald-600 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2 sm:gap-3">
              <span>📸</span> חזרה למצלמה
            </button>
          )}
          
          <button onClick={onClose} className={`w-full py-2 text-sm font-bold transition-colors ${
            isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
          }`}>
            סגור סורק
          </button>
        </div>

        <style>{`
          #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 16px; }
          @media (min-width: 640px) { #reader video { border-radius: 24px; } }
          @keyframes scan-line { 0% { top: 0% } 100% { top: 100% } }
          .animate-scan-line { animation: scan-line 2.5s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
}