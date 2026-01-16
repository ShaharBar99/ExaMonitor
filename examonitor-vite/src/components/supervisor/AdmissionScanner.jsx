import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";

export default function AdmissionScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [view, setView] = useState('camera'); // 'camera' | 'file'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastScanned, setLastScanned] = useState(""); // להצגת פידבק מהיר על הסריקה האחרונה
  
  // נעילה פנימית למניעת הצפה של קריאות ל-onScan
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
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = (decodedText) => {
    if (scanLock.current) return;
    
    scanLock.current = true;
    setLastScanned(decodedText);
    onScan(decodedText);

    // שחרור הנעילה לאחר 1.5 שניות כדי לאפשר סריקה של הסטודנט הבא
    setTimeout(() => {
      scanLock.current = false;
    }, 1500);
  };

  const startCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) return;
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
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
      // פענוח הקובץ
      const result = await scannerRef.current.scanFileV2(file, true);
      
      if (result && result.decodedText) {
        handleScanSuccess(result.decodedText);
      }
    } catch (err) {
      console.error("Scan error:", err);
      alert("לא נמצא ברקוד בתמונה. נא לוודא שהתמונה ברורה וכוללת ברקוד תקין.");
    } finally {
      setIsProcessing(false);
      // איפוס ה-input מאפשר להעלות קובץ נוסף מיד
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl flex flex-col min-h-137.5 animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 left-8 text-slate-400 hover:text-rose-500 text-3xl transition-colors">✕</button>
        
        <div className="text-center mb-6">
          <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100">
            <span className="text-2xl">{view === 'camera' ? '📸' : '📁'}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">סריקה רציפה</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {view === 'camera' ? 'השאר את המצלמה מול הברקוד' : 'ניתן להעלות מספר תמונות ברצף'}
          </p>
        </div>

        {/* מצב מצלמה */}
        <div className={`relative rounded-[30px] overflow-hidden border-4 border-slate-100 bg-black aspect-square mb-6 shadow-inner ${view === 'camera' ? 'block' : 'hidden'}`}>
          <div id="reader" className="w-full h-full"></div>
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 shadow-[0_0_20px_#10b981] z-20 animate-scan-line"></div>
          
          {/* חיווי ויזואלי לסריקה מוצלחת */}
          {scanLock.current && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center z-30 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-full p-4 shadow-2xl scale-110 animate-bounce">
                    <span className="text-4xl">✅</span>
                </div>
            </div>
          )}
        </div>

        {/* מצב קובץ */}
        {view === 'file' && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => !isProcessing && fileInputRef.current.click()}
            className={`relative rounded-[30px] border-4 border-dashed aspect-square mb-6 flex flex-col items-center justify-center transition-all cursor-pointer group ${
              isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-black text-slate-800 text-lg">מנתח תמונה...</span>
              </div>
            ) : (
              <div className="text-center p-6 transition-transform group-hover:scale-110">
                <div className="text-5xl mb-4 drop-shadow-md">📥</div>
                <p className="font-black text-slate-700 text-xl">לחץ לסריקה נוספת</p>
                <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase">או גרור קובץ לכאן</p>
              </div>
            )}
            
            {/* חיווי אחרון שנסרק בקובץ */}
            {lastScanned && !isProcessing && (
                <div className="absolute bottom-4 bg-emerald-600 text-white px-4 py-1 rounded-full text-[10px] font-black">
                    נסרק לאחרונה: {lastScanned}
                </div>
            )}
          </div>
        )}

        <div className="mt-auto space-y-3">
          <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} accept="image/*" className="hidden" />
          
          {view === 'camera' ? (
            <button onClick={switchToUpload} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg">
              <span>📂</span> העלאת קבצים
            </button>
          ) : (
            <button onClick={switchToCamera} className="w-full border-4 border-emerald-500 text-emerald-600 py-4 rounded-2xl font-black uppercase hover:bg-emerald-50 transition-all flex items-center justify-center gap-3">
              <span>📸</span> חזרה למצלמה
            </button>
          )}
          
          <button onClick={onClose} className="w-full text-slate-400 py-2 font-bold hover:text-slate-600 transition-colors">
            סיום עבודה
          </button>
        </div>

        <style>{`
          #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 24px; }
          @keyframes scan-line { 0% { top: 0% } 100% { top: 100% } }
          .animate-scan-line { animation: scan-line 2.5s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
}