import React, { useState, useEffect } from "react";
import FormField from "../../shared/FormField";
import { createNewClassroom, updateClassroomDetails } from "../../../handlers/classroomHandlers";
import { fetchExamsForAssignment, fetchSupervisors } from "../../../handlers/classroomHandlers";

export default function CreateClassroomModal({ onClose, onSuccess, isDark, initialData = null }) {
  const [formData, setFormData] = useState({ 
    room_number: "", 
    exam_id: "", 
    supervisor_id: null, 
    floor_supervisor_id: null 
  });
  const [exams, setExams] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  useEffect(() => {
    loadData();
    if (isEditing) {
      setFormData({
        room_number: initialData.room_number || "",
        exam_id: initialData.exam_id || "",
        supervisor_id: initialData.supervisor_id || null,
        floor_supervisor_id: initialData.floor_supervisor_id || null,
      });
    }
  }, [initialData, isEditing]);

  const loadData = async () => {
    try {
      const examsRes = await fetchExamsForAssignment({});
      if (examsRes.ok) setExams(examsRes.data.exams || []);
      
      const supRes = await fetchSupervisors({});
      if (supRes.ok) setSupervisors(supRes.data.supervisors || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.room_number || !formData.exam_id) {
      return alert("שדות חובה: מספר חדר ובחירת בחינה");
    }

    setLoading(true);
    try {
      let res;
      if (isEditing) {
        res = await updateClassroomDetails(initialData.id, {
          room_number: formData.room_number,
          supervisor_id: formData.supervisor_id || null,
          floor_supervisor_id: formData.floor_supervisor_id || null,
          exam_id: formData.exam_id,
        });
      } else {
        res = await createNewClassroom({
          room_number: formData.room_number,
          exam_id: formData.exam_id,
          supervisor_id: formData.supervisor_id || null,
          floor_supervisor_id: formData.floor_supervisor_id || null,
        });
      }

      if (res.ok) {
        onSuccess();
        onClose();
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
          <h2 className="text-xl font-black">{isEditing ? "עריכת חדר בחינה" : "הוספת חדר בחינה חדש"}</h2>
          <button onClick={onClose} className="text-2xl opacity-50">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField 
            label="מספר חדר" 
            value={formData.room_number} 
            onChange={e => setFormData({...formData, room_number: e.target.value})} 
            isDark={isDark} 
            placeholder="101"
          />

          <div className="space-y-2">
            <label className="block text-sm font-bold">בחינה</label>
            <select
              value={formData.exam_id}
              onChange={e => setFormData({...formData, exam_id: e.target.value})}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${
                isDark 
                  ? "bg-slate-800 border-white/10 text-white" 
                  : "bg-white border-slate-200"
              }`}
            >
              <option value="">בחר בחינה</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.course_code} - {new Date(exam.date).toLocaleDateString('he-IL')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold">משגיח בחדר (אופציונלי)</label>
            <select
              value={formData.supervisor_id || ""}
              onChange={e => setFormData({...formData, supervisor_id: e.target.value || null})}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${
                isDark 
                  ? "bg-slate-800 border-white/10 text-white" 
                  : "bg-white border-slate-200"
              }`}
            >
              <option value="">ללא משגיח</option>
              {supervisors.filter(s => s.role === 'supervisor').map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.full_name} ({supervisor.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold">משגיח קומה (אופציונלי)</label>
            <select
              value={formData.floor_supervisor_id || ""}
              onChange={e => setFormData({...formData, floor_supervisor_id: e.target.value || null})}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${
                isDark 
                  ? "bg-slate-800 border-white/10 text-white" 
                  : "bg-white border-slate-200"
              }`}
            >
              <option value="">ללא משגיח קומה</option>
              {supervisors.filter(s => s.role === 'floor_supervisor').map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.full_name} ({supervisor.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (isEditing ? "מעדכן..." : "יוצר...") : (isEditing ? "שמור שינויים" : "הוסף חדר")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
