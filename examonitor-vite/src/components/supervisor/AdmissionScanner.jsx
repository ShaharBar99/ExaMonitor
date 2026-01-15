import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";

export default function AdmissionScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [view, setView] = useState('camera'); // 'camera' | 'file'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // אתחול המופע פעם אחת בלבד כשהקומפוננטה עולה
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    // הפעלת מצלמה בטעינה
    startCamera();

    return () => {
      // ניקוי סופי ביציאה מהמודל
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (text) => onScan(text),
        () => {} 
      );
    } catch (err) {
      console.error("Camera failed:", err);
    }
  };

  const switchToUpload = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop(); // עוצרים וידאו אבל לא עושים clear למנוע
    }
    setView('file');
  };

  const switchToCamera = async () => {
    setView('camera');
    // מחכים שה-DOM יתעדכן והדיב "reader" יחזור להופיע
    setTimeout(() => startCamera(), 150);
  };

  const processFile = async (file) => {
    if (!file || !scannerRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // סריקה ישירה מהקובץ
      const result = await scannerRef.current.scanFileV2(file, true);
      
      if (result && result.decodedText) {
        onScan(result.decodedText);
      }
    } catch (err) {
      console.error("Scan error:", err);
      alert("לא נמצא ברקוד בתמונה. נסה שוב.");
    } finally {
      // איפוס הסטטוס בכל מקרה (גם אם הצליח וגם אם נכשל)
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl flex flex-col min-h-125">
        <button onClick={onClose} className="absolute top-6 left-8 text-slate-400 hover:text-rose-500 text-2xl">✕</button>
        
        <div className="text-center mb-6">
          <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">{view === 'camera' ? '📸' : '📁'}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase">סריקת ברקוד</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            {view === 'camera' ? 'סריקה חיה במצלמה' : 'בחירת קובץ מהמכשיר'}
          </p>
        </div>

        {/* מצב מצלמה */}
        <div className={`relative rounded-[30px] overflow-hidden border-4 border-slate-100 bg-black aspect-square mb-6 ${view === 'camera' ? 'block' : 'hidden'}`}>
          <div id="reader" className="w-full h-full"></div>
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] z-20 animate-scan-line"></div>
        </div>

        {/* מצב קובץ */}
        {view === 'file' && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => !isProcessing && fileInputRef.current.click()}
            className={`relative rounded-[30px] border-4 border-dashed aspect-square mb-6 flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-200 bg-slate-50'}`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-slate-800 italic">מנתח נתונים...</span>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="text-4xl mb-4 text-slate-400">📥</div>
                <p className="font-bold text-slate-700">לחץ לבחירה או גרור קובץ</p>
                <p className="text-[10px] text-slate-400 mt-2">JPG, PNG, WEBP</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto space-y-3">
          <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} accept="image/*" className="hidden" />
          
          {view === 'camera' ? (
            <button onClick={switchToUpload} className="w-full border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-2">📂 העלאת תמונה</button>
          ) : (
            <button onClick={switchToCamera} className="w-full border-2 border-emerald-500 text-emerald-600 py-4 rounded-2xl font-black uppercase hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">📸 חזרה למצלמה</button>
          )}
          
          <button onClick={onClose} className="w-full bg-slate-100 py-3 rounded-2xl font-bold text-slate-500">ביטול</button>
        </div>

        <style>{`
          #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
          @keyframes scan-line { 0% { top: 0% } 100% { top: 100% } }
          .animate-scan-line { animation: scan-line 3s linear infinite; }
        `}</style>
      </div>
    </div>
  );
}