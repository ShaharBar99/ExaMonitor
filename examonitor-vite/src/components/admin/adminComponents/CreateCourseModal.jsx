import React, { useState, useEffect } from "react";
import FormField from "../../shared/FormField";
import { createNewCourse, updateCourseDetails } from "../../../handlers/courseHandlers";
import { searchLecturerByEmail } from "../../../api/usersApi";

export default function CreateCourseModal({ onClose, onSuccess, isDark, initialData = null }) {
  const [formData, setFormData] = useState({ name: "", code: "", lecturerEmail: "", lecturerId: null });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [lecturerFound, setLecturerFound] = useState(null);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: initialData.course_name || "",
        code: initialData.course_code || "",
        lecturerId: initialData.lecturer_id || null,
        lecturerEmail: initialData.lecturer_email || "",
      });
      if (initialData.lecturer_id && initialData.lecturer_name) {
        setLecturerFound({ id: initialData.lecturer_id, full_name: initialData.lecturer_name, email: initialData.lecturer_email });
      }
    }
  }, [initialData, isEditing]);

  const handleSearchLecturer = async () => {
    if (!formData.lecturerEmail) return;
    
    setSearching(true);
    try {
      const res = await searchLecturerByEmail(formData.lecturerEmail);
      const users = res.users || [];
      const lecturer = users.find(u => u.email === formData.lecturerEmail && u.role === "lecturer");
      
      if (lecturer) {
        setLecturerFound(lecturer);
        setFormData(prev => ({ ...prev, lecturerId: lecturer.id }));
      } else {
        alert("מרצה עם המייל הזה לא נמצא");
        setLecturerFound(null);
        setFormData(prev => ({ ...prev, lecturerId: null }));
      }
    } catch (err) {
      alert("שגיאה בחיפוש: " + err.message);
      setLecturerFound(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return alert("Missing required fields");
    
    setLoading(true);
    try {
      let res;
      const courseData = {
        course_name: formData.name,
        course_code: formData.code,
        lecturer_id: formData.lecturerId || null,
      };

      if (isEditing) {
        res = await updateCourseDetails(initialData.id, courseData);
      } else {
        res = await createNewCourse(courseData);
      }

      if (res.ok) {
        onSuccess();
        onClose(); // onSuccess should handle closing and reloading
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 transition-all ${isDark ? "bg-slate-900 border border-white/10 text-white" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black">{isEditing ? "עריכת קורס" : "הוספת קורס חדש"}</h2>
          <button onClick={onClose} className="text-2xl opacity-50">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="שם הקורס" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} isDark={isDark} />
          <FormField label="קוד קורס" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isDark={isDark} />
          
          <div className="space-y-2">
            <label className="block text-sm font-bold">מייל מרצה (אופציונלי)</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="lecturer@example.com"
                value={formData.lecturerEmail}
                onChange={e => setFormData({...formData, lecturerEmail: e.target.value})}
                className={`flex-1 px-4 py-2.5 rounded-xl border outline-none transition-all ${
                  isDark 
                    ? "bg-slate-800 border-white/10 text-white placeholder-slate-400" 
                    : "bg-white border-slate-200 placeholder-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={handleSearchLecturer}
                disabled={searching || !formData.lecturerEmail}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  searching || !formData.lecturerEmail
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
              >
                {searching ? "חיפוש..." : "חפש"}
              </button>
            </div>
            {lecturerFound && (
              <div className={`p-3 rounded-lg text-sm font-bold ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-700"}`}>
                ✓ נמצא: {lecturerFound.full_name}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading || searching} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
              {loading ? (isEditing ? "מעדכן..." : "יוצר...") : (isEditing ? "שמור שינויים" : "צור קורס")}
            </button>
            <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                isDark 
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}