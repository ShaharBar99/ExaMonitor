import React, { useState, useEffect, useMemo } from "react";
import { fetchAvailableStudents, addStudentToCourseHandler } from "../../../handlers/courseHandlers";

export default function AddStudentModal({ courseId, onClose, onAdded, isDark }) {
  const [available, setAvailable] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAvailableStudents(courseId).then(res => {
      if (res.ok) setAvailable(res.data.students || []);
    });
  }, [courseId]);

  const filtered = useMemo(() => {
    return available.filter(s => 
      s.full_name.toLowerCase().includes(search.toLowerCase()) || 
      s.student_id.includes(search)
    );
  }, [available, search]);

  const handleAdd = async (student) => {
    try {
      const res = await addStudentToCourseHandler(courseId, student);
      if (res.ok) {
        onAdded(student);
        setAvailable(prev => prev.filter(s => s.id !== student.id));
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-110 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? "bg-slate-800 text-white" : "bg-white"}`}>
        <div className="flex justify-between mb-4">
          <h3 className="font-black">הוספת סטודנט לקורס</h3>
          <button onClick={onClose}>&times;</button>
        </div>
        <input 
          type="text" placeholder="חיפוש לפי שם או ת.ז..." 
          className={`w-full p-3 rounded-xl mb-4 border ${isDark ? "bg-slate-700 border-white/10" : "bg-slate-100"}`}
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 bg-black/5 rounded-lg">
              <span className="text-sm font-bold">{s.full_name}</span>
              <button onClick={() => handleAdd(s)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">הוסף</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}