import React, { useState, useEffect } from "react";
import FormField from "../../shared/FormField";
import { createExam, updateExam } from "../../../handlers/adminExamHandlers";
import { fetchCourses, fetchCourseLecturers } from "../../../handlers/courseHandlers"; // fetchCourseLecturers needed here

export default function CreateExamModal({ onClose, onSuccess, isDark, initialData = null }) {
  const [formData, setFormData] = useState({
    course_id: "",
    examDate: "",
    examTime: "",
    duration: "120",
    extra_time: "0",
    lecturer_id: "",
  });
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  // 1. Load courses on mount
  useEffect(() => {
    async function loadCoursesForSelect() {
      try {
        const res = await fetchCourses({});
        if (res.ok) setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to load courses for modal", err);
      }
    }
    loadCoursesForSelect();
  }, []);

  // 2. Load lecturers when course changes (or courses list loads)
  useEffect(() => {
    async function loadLecturers() {
      if (!formData.course_id) {
        setLecturers([]);
        return;
      }

      setLoading(true);
      try {
        // 1. Get Main Lecturer from course details (if available)
        const selectedCourse = courses.find(c => c.id === formData.course_id);
        const mainLecturer = selectedCourse && selectedCourse.lecturer_id ? {
          id: selectedCourse.lecturer_id,
          full_name: selectedCourse.lecturer_name || 'Main Lecturer',
          email: selectedCourse.lecturer_email || ''
        } : null;

        // 2. Get Course Lecturers
        const { data } = await fetchCourseLecturers(formData.course_id);
        const cLecturers = [
          ...(mainLecturer ? [mainLecturer] : []),
          ...(data?.lecturers || [])
        ];

        // Unique by ID
        const uniqueLecturers = Array.from(new Map(cLecturers.map(item => [item.id, item])).values());

        setLecturers(uniqueLecturers);
      } catch (err) {
        console.error("Failed to load course lecturers", err);
      } finally {
        setLoading(false);
      }
    }
    loadLecturers();
  }, [formData.course_id, courses]); // Re-run when course changes or courses load

  // 3. Initialize form data for editing
  useEffect(() => {
    if (isEditing && initialData) {
      const startDate = new Date(initialData.date);
      setFormData({
        course_id: initialData.course_id || "",
        examDate: startDate.toISOString().split('T')[0],
        examTime: startDate.toTimeString().split(' ')[0].substring(0, 5),
        duration: initialData.duration?.toString() || "120",
        extra_time: initialData.extra_time?.toString() || "0",
        lecturer_id: initialData.lecturer_id || "", // Ensure loaded
      });
    }
  }, [initialData, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !formData.course_id) return alert("Please select a course.");
    if (!formData.examDate || !formData.examTime || !formData.duration) return alert("Please fill all required fields.");

    setLoading(true);
    try {
      let res;
      const combinedDateTime = `${formData.examDate}T${formData.examTime}:00`;

      if (isEditing) {
        const updateData = {
          original_start_time: new Date(combinedDateTime).toISOString(),
          original_duration: Number(formData.duration),
          extra_time: Number(formData.extra_time),
          course_id: formData.course_id,
        };
        res = await updateExam(initialData.id, updateData);
      } else {
        const selectedCourse = courses.find(c => c.id === formData.course_id);
        if (!selectedCourse) return alert("Invalid course selected.");

        const createData = {
          courseCode: selectedCourse.course_code,
          courseName: selectedCourse.course_name,
          lecturerEmail: selectedCourse.lecturer_email,
          examDate: formData.examDate,
          examTime: formData.examTime,
          examDate: formData.examDate,
          examTime: formData.examTime,
          duration: Number(formData.duration),
          lecturer_id: formData.lecturer_id || undefined,
        };
        res = await createExam(createData);
      }

      if (res.id || res.success || res.exam?.id) {
        onSuccess();
        onClose();
      } else {
        throw new Error(res.error || "An unknown error occurred");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 transition-all ${isDark ? "bg-slate-900 border border-white/10 text-white" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black">{isEditing ? "עריכת בחינה" : "הוספת בחינה חדשה"}</h2>
          <button onClick={onClose} className="text-2xl opacity-50">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold">קורס</label>
            <select
              value={formData.course_id}
              onChange={e => {
                const newCourseId = e.target.value;
                const selectedCourse = courses.find(c => c.id === newCourseId);
                // Auto-select lecturer if course has one and not already set manually?
                // Or just set it if field is empty.
                let newLecturerId = formData.lecturer_id;
                if (selectedCourse && selectedCourse.lecturer_id) {
                  newLecturerId = selectedCourse.lecturer_id;
                }
                setFormData({ ...formData, course_id: newCourseId, lecturer_id: newLecturerId || "" });
              }}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"}`}
            >
              <option value="">בחר קורס</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold">מרצה ראשי (אופציונלי - ברירת מחדל מרצה הקורס)</label>
            <select
              value={formData.lecturer_id}
              onChange={e => setFormData({ ...formData, lecturer_id: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <FormField label="תאריך" type="date" value={formData.examDate} onChange={e => setFormData({ ...formData, examDate: e.target.value })} isDark={isDark} />
            <FormField label="שעת התחלה" type="time" value={formData.examTime} onChange={e => setFormData({ ...formData, examTime: e.target.value })} isDark={isDark} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="משך (דקות)" type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} isDark={isDark} />
            <FormField label="תוספת זמן (דקות)" type="number" value={formData.extra_time} onChange={e => setFormData({ ...formData, extra_time: e.target.value })} isDark={isDark} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
              {loading ? (isEditing ? "מעדכן..." : "יוצר...") : (isEditing ? "שמור שינויים" : "צור בחינה")}
            </button>
            <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}