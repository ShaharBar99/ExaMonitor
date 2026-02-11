import React, { useState, useEffect } from "react";
import FormField from "../../shared/FormField";
import { createNewCourse, updateCourseDetails } from "../../../handlers/courseHandlers";
import { listUsers } from "../../../api/usersApi"; // Use listUsers instead of searchLecturerByEmail

export default function CreateCourseModal({ onClose, onSuccess, isDark, initialData = null }) {
  const [formData, setFormData] = useState({ name: "", code: "", lecturerId: "" });
  const [loading, setLoading] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const isEditing = !!initialData;

  useEffect(() => {
    // Load lecturers
    async function loadLecturers() {
      try {
        const res = await listUsers({ role: 'lecturer' });
        if (res.users) setLecturers(res.users);
        else if (Array.isArray(res)) setLecturers(res);
      } catch (err) {
        console.error("Failed to load lecturers", err);
      }
    }
    loadLecturers();

    if (isEditing) {
      setFormData({
        name: initialData.course_name || "",
        code: initialData.course_code || "",
        lecturerId: initialData.lecturer_id || "",
      });
    }
  }, [initialData, isEditing]);

  // Removed handleSearchLecturer

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
          <FormField label="שם הקורס" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} isDark={isDark} />
          <FormField label="קוד קורס" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} isDark={isDark} />

          <div className="space-y-2">
            <label className="block text-sm font-bold">מרצה ראשי (אופציונלי)</label>
            <select
              value={formData.lecturerId}
              onChange={e => setFormData({ ...formData, lecturerId: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"}`}
            >
              <option value="">בחר מרצה ראשי</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.full_name} ({lecturer.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
              {loading ? (isEditing ? "מעדכן..." : "יוצר...") : (isEditing ? "שמור שינויים" : "צור קורס")}
            </button>
            <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}