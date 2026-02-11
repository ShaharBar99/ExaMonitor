import React, { useState, useEffect, useRef } from "react";
import { fetchCourseStudents, removeStudentFromCourseHandler, importStudentsToCourse } from "../../../handlers/courseHandlers";
import AddStudentModal from "./AddStudentModal";

/**
 * Modal for managing students enrolled in a course.
 * Supports manual addition and bulk import via Excel.
 *
 * @param {object} props
 * @param {object} props.course - The course object.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {boolean} props.isDark - Theme mode.
 */
export default function ManageStudentsModal({ course, onClose, isDark }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef(null);
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetchCourseStudents(course.id);
      if (res.ok) setStudents(res.data.students || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, [course.id]);

  const handleRemove = async (studentId) => {
    if (!window.confirm("להסיר מהקורס?")) return;
    try {
      await removeStudentFromCourseHandler(course.id, studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) { alert(err.message); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await importStudentsToCourse(course.id, formData);
      if (res.ok) loadStudents();
    } finally { e.target.value = ""; }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border border-white/10 text-white" : "bg-white"}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">{course.course_name}</h2>
            <p className="text-xs opacity-60">ניהול רשימת סטודנטים</p>
          </div>
          <button onClick={onClose} className="text-xl">&times;</button>
        </div>
        
        <div className="p-4 grid grid-cols-2 gap-3">
          <input type="file" hidden ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" />
          <button onClick={() => fileInputRef.current.click()} className="p-3 rounded-xl border border-green-500/30 bg-green-500/5 text-green-500 font-bold text-xs">📥 ייבוא אקסל</button>
          <button onClick={() => setShowAddModal(true)} className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-500 font-bold text-xs">➕ הוספה ידנית</button>
        </div>

        <div className="px-4 text-[11px] text-slate-500">
          פורמט קובץ Excel:
          <span className="font-mono ml-1">student_id | email</span>
        </div>

        {showAddModal && <AddStudentModal courseId={course.id} isDark={isDark} onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); loadStudents(); }} />}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? <p className="text-center animate-pulse p-10">טוען...</p> : 
            students.map(s => (
              <div key={s.id} className={`flex justify-between items-center p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <div className="text-sm"><p className="font-bold">{s.full_name}</p><p className="opacity-50 font-mono">{s.student_id}</p></div>
                <button onClick={() => handleRemove(s.id)} className="text-red-500 text-xs font-black">הסר</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}