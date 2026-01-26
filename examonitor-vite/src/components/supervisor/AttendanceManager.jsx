import React, { useState, useRef, useMemo, useEffect } from 'react';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { classroomHandler } from '../../handlers/classroomHandlers';
import StudentGrid from './StudentGrid';
import StatCard from '../exam/StatCard'; // Adjusted path based on your imports
import AdmissionScanner from './AdmissionScanner';

export default function AttendanceManager({ 
  examId, 
  classrooms, 
  isDark, 
  students, 
  setStudents, 
  setBotMsg 
}) {
  // --- Local UI State ---
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRemoveBarOpen, setIsRemoveBarOpen] = useState(false);
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // --- Move Student Logic State ---
  const [studentToMove, setStudentToMove] = useState(null); 
  const [otherClassrooms, setOtherClassrooms] = useState([]); 

  // --- Refs for Search and Scanner Lock ---
  const searchTimeout = useRef(null);
  const lastScannedId = useRef(null);
  const scanLock = useRef(false);

  // --- 1. Status Change Logic ---
  const handleStatusChange = async (id, status) => {
    const student = students.find(s => s.id === id || s.studentId === id);
    if (!student) return;

    if (status === 'שירותים') {
      await attendanceHandlers.handleStartBreak(student.id, 'toilet', setStudents);
    } else if (status === 'במבחן' && student.status === 'exited_temporarily') {
      await attendanceHandlers.handleEndBreak(student.id, setStudents);
    } else {
      const mappedStatus = status === 'במבחן' ? 'present' : status === 'סיים' ? 'submitted' : status;
      await attendanceHandlers.changeStudentStatus(student.id, mappedStatus, setStudents);
    }
  };

  // --- 2. Scanner Logic (with your specific lock/re-entry logic) ---
  const handleScanResult = async (scannedId) => {
    if (scanLock.current || scannedId === lastScannedId.current) return;
    scanLock.current = true;
    lastScannedId.current = scannedId;

    const student = students.find(s => s.student_id === scannedId || s.id === scannedId || s.studentId === scannedId);
    
    if (student) {
      if (student.status === 'absent' || !student.status) {
        await handleStatusChange(student.id, 'במבחן');
        setBotMsg({ text: `✅ כניסה למבחן: ${student.name}` });
      } else if (student.status === 'present') {
        await attendanceHandlers.handleStartBreak(student.id, 'toilet', setStudents);
        setBotMsg({ text: `🚶 יציאה לשירותים: ${student.name}`, isAlert: false });
      } else if (student.status === 'exited_temporarily') {
        await attendanceHandlers.handleEndBreak(student.id, setStudents);
        setBotMsg({ text: `🔙 חזרה מהשירותים: ${student.name}` });
      } else if (student.status === 'submitted') {
        setBotMsg({ text: `🚫 ${student.name} כבר הגיש/ה את הבחינה ולא ניתן לקלוט שוב.` });
      }
    } else {
      // Logic for adding a student not currently in the local grid
      await attendanceHandlers.handleAddStudent(classrooms.id, null, setStudents, scannedId);
      setBotMsg({ text: `✨ ${scannedId} נוסף ונקלט.` });  
    }

    setTimeout(() => {
      scanLock.current = false;
      lastScannedId.current = null;
    }, 3000);
  };

  // --- 3. Move Student Handlers ---
  const handleOpenMoveModal = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    setStudentToMove(student);
    try {
      const allRooms = await classroomHandler.getClassrooms(examId);
      const filteredRooms = allRooms.filter(room => room.id !== classrooms.id);
      setOtherClassrooms(filteredRooms);
    } catch (err) {
      console.error("Failed to fetch other classrooms", err);
    }
  };

  const handleExecuteMove = async (targetRoomId) => {
    if (!studentToMove) return;
    try {
      await attendanceHandlers.handleRemoveStudent(studentToMove.id, setStudents);
      await attendanceHandlers.handleAddStudent(targetRoomId, null, () => {}, studentToMove.studentId);
      setBotMsg({ text: `🔄 הסטודנט ${studentToMove.name} הועבר בהצלחה לחדר אחר.` });
      setStudentToMove(null);
    } catch (err) {
      console.error("Transfer failed:", err);
      alert("ההעברה נכשלה.");
    }
  };

  // --- 4. Search Logic ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length > 2) {
      searchTimeout.current = setTimeout(async () => {
        await attendanceHandlers.handleSearchEligible(examId, value, setSearchResults, setIsSearching);

      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const confirmRemoval = async (student) => {
    if (window.confirm(`להסיר את ${student.name}?`)) {
      await attendanceHandlers.handleRemoveStudent(student.id, setStudents);
      setRemoveSearchQuery('');
      setIsRemoveBarOpen(false);
    }
  };

  // --- 5. Memos ---
  const filteredForRemoval = useMemo(() => {
    if (!removeSearchQuery || removeSearchQuery.length < 2) return [];
    return students.filter(s => 
      s.student_id?.includes(removeSearchQuery) || 
      s.name.toLowerCase().includes(removeSearchQuery.toLowerCase())
    ).slice(0, 3);
  }, [students, removeSearchQuery]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats and Scan Toggle */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        <StatCard label="רשומים" value={students.length} variant="default" icon="👥" />
        <StatCard label="בחדר" value={students.filter(s => s.status === 'present').length} variant="info" icon="🏠" />
        
        <div className="col-span-2 md:col-span-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="w-full h-full bg-emerald-500 text-white rounded-[25px] md:rounded-[35px] flex flex-col items-center justify-center gap-1 hover:bg-emerald-400 shadow-2xl border-b-4 md:border-b-8 border-emerald-700 active:border-b-0 transition-all py-4"
          >
            <span className="text-3xl md:text-5xl">📷</span>
            <span className="font-black text-lg md:text-2xl uppercase">סרוק סטודנט</span>
          </button>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className={`rounded-[30px] md:rounded-[50px] shadow-2xl flex flex-col relative overflow-hidden min-h-125 border-4 md:border-8 transition-all duration-500 ${
        isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-white'
      }`}>
        
        {/* Quick Removal Overlay */}
        <div className={`absolute top-0 left-0 w-full z-40 transition-all duration-500 bg-rose-600 ${isRemoveBarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="px-6 py-4 md:px-12 md:py-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <input 
              type="text" placeholder="חפש שם להסרה..."
              className="w-full md:flex-1 bg-white/20 border-2 border-white/30 rounded-2xl py-3 px-6 text-xl text-white font-bold placeholder:text-white/50 outline-none"
              value={removeSearchQuery} onChange={(e) => setRemoveSearchQuery(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {filteredForRemoval.map(s => (
                <button key={s.id} onClick={() => confirmRemoval(s)} className="bg-white px-4 py-2 rounded-xl font-black text-slate-800 text-sm">
                  {s.name} ✖
                </button>
              ))}
            </div>
            <button onClick={() => setIsRemoveBarOpen(false)} className="text-white font-black">ביטול</button>
          </div>
        </div>

        {/* Search Header */}
        <div className="p-6 md:p-12 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-3xl md:text-5xl font-black italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Attendance</h2>
            <button onClick={() => setIsRemoveBarOpen(true)} className="text-rose-600 font-black text-lg underline underline-offset-4">✖ הסרה מהירה</button>
          </div>

          <div className="relative">
            <input 
              type="text" placeholder="חיפוש או הוספת סטודנט..." 
              className={`w-full py-5 px-8 rounded-[20px] md:rounded-[30px] font-black text-xl md:text-3xl shadow-inner outline-none transition-all border-2 md:border-4 ${
                isDark ? 'bg-slate-800 border-transparent text-white focus:border-emerald-500/40' : 'bg-slate-100 text-slate-700'
              }`}
              value={searchQuery} onChange={handleSearchChange}
            />
            {searchResults.length > 0 && (
              <ul className={`absolute z-50 w-full mt-2 rounded-[20px] shadow-2xl border-2 overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                {searchResults.map(result => (
                  <li key={result.id} 
                      onClick={() => { attendanceHandlers.handleAddStudent(classrooms.id, result.id, setStudents, result.student_id); setSearchQuery(''); setSearchResults([]); }}
                      className={`px-6 py-4 cursor-pointer flex justify-between items-center border-b last:border-0 ${isDark ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-emerald-50 border-slate-100'}`}>
                    <span className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{result.full_name} ({result.student_id})</span>
                    <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black">הוסף +</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-12 pt-0 overflow-y-auto">
          <StudentGrid 
            students={students} 
            onStatusChange={handleStatusChange} 
            onMoveClass={handleOpenMoveModal} 
          />
        </div>
      </div>

      {/* --- Modals & Overlays --- */}

      {isScannerOpen && (
        <AdmissionScanner 
          onScan={handleScanResult} 
          onClose={() => { setIsScannerOpen(false); scanLock.current = false; }} 
        />
      )}

      {studentToMove && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setStudentToMove(null)} />
          <div className={`relative rounded-[30px] p-8 w-full max-w-lg shadow-2xl text-right ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>העברת כיתה</h3>
            <p className="text-slate-400 font-bold mb-6">לאיזו כיתה תרצה להעביר את <span className="text-emerald-600">{studentToMove.name}</span>?</p>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
              {otherClassrooms.map(room => (
                <button key={room.id} onClick={() => handleExecuteMove(room.id)}
                  className={`w-full flex justify-between items-center p-4 border-2 border-transparent rounded-2xl transition-all ${isDark ? 'bg-slate-800 hover:border-emerald-500/30' : 'bg-slate-50 hover:bg-emerald-50'}`}>
                  <span className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>חדר {room.room_number}</span>
                  <span className="text-emerald-600 font-black">העבר לכאן ←</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStudentToMove(null)} className="w-full mt-6 text-slate-400 font-black">ביטול</button>
          </div>
        </div>
      )}
    </div>
  );
}