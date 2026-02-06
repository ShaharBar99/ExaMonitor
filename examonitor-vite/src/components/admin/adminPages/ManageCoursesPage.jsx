import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../state/ThemeContext";
import { useAuth } from "../../state/AuthContext";
import AdminTable from "../adminComponents/AdminTable";
import CreateCourseModal from "../adminComponents/CreateCourseModal";
import CourseStudentsModal from "../adminComponents/ManageStudentsModal";
import { fetchCourses, deleteCourseHandler, filterCourses, importCoursesFromExcel } from "../../../handlers/courseHandlers";
import AddStudentModal from "../adminComponents/AddStudentModal";

export default function ManageCoursesPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // --- States ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [rowBusyId, setRowBusyId] = useState("");

  // Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const coursesFileInputRef = useRef(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await fetchCourses({ search }, {});
      if (res.ok) setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [search, user]);

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("בטוח שברצונך למחוק קורס זה?")) return;
    setRowBusyId(courseId);
    try {
      await deleteCourseHandler(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setRowBusyId("");
    }
  };

  const openStudentsModal = (course) => {
    setSelectedCourse(course);
    setShowStudentsModal(true);
  };

  const handleImportCourses = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await importCoursesFromExcel(formData);
      if (res.ok) {
        loadCourses();
        alert("קורסים יובאו בהצלחה");
      }
    } catch (err) {
      alert("שגיאה בייבוא: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const filtered = useMemo(() => filterCourses(courses, { search }), [courses, search]);

  const columns = [
    { key: "code", header: "קוד קורס" },
    { key: "name", header: "שם קורס" },
    { key: "lecturer", header: "מרצה" },
    { key: "students", header: "סטודנטים" },
    { key: "actions", header: "פעולות" },
  ];

  return (
    <div className={`min-h-screen pb-20 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">ניהול קורסים</h1>
            <p className="text-sm mt-1 opacity-70">יצירה וניהול של תוכניות הלימוד והרשמות סטודנטים</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                hidden 
                ref={coursesFileInputRef} 
                onChange={handleImportCourses} 
                accept=".xlsx,.xls,.csv" 
              />
              <button
                onClick={() => coursesFileInputRef.current?.click()}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                  isDark ? "bg-slate-800 border-white/10 text-green-400" : "bg-white border-green-200 text-green-600"
                }`}
              >
                📥 ייבוא
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                + קורס חדש
              </button>
            </div>
            <div className="text-[11px] text-slate-500">
              פורמט קובץ Excel:
              <span className="font-mono ml-1">course_code | course_name | lecturer_email</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative group">
            <span className="absolute inset-y-0 right-4 flex items-center text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="חיפוש קורס לפי שם או קוד..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pr-12 pl-4 py-3.5 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${
                isDark ? "bg-slate-800/50 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>
        </div>

        {/* Table/Cards Container */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/5 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"}`}>
          <div className="hidden md:block">
            <AdminTable columns={columns} loading={loading} isDark={isDark}>
              {filtered.map((course) => (
                <tr key={course.id} className={`border-t transition-colors ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"}`}>
                  <td className="px-6 py-4 font-mono text-sm">{course.course_code}</td>
                  <td className="px-6 py-4 font-bold">{course.course_name}</td>
                  <td className="px-6 py-4 opacity-80">{course.lecturer_name || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                      {course.student_count || 0} סטודנטים
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openStudentsModal(course)} className="px-4 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold text-xs transition-all">שיבוץ סטודנטים</button>
                      <button onClick={() => handleDeleteCourse(course.id)} disabled={rowBusyId === course.id} className="px-4 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-xs transition-all">מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
            {filtered.map((course) => (
              <div key={course.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{course.course_code}</span>
                    <h3 className="font-bold text-lg">{course.course_name}</h3>
                    <p className="text-xs opacity-60">מרצה: {course.lecturer_name || "לא הוגדר"}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openStudentsModal(course)} className="p-2.5 rounded-xl bg-green-500/10 text-green-500">👥</button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-500">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showCreateModal && (
        <CreateCourseModal 
          isDark={isDark} 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={(newCourse) => setCourses(prev => [...prev, newCourse])}
        />
      )}

      {showStudentsModal && selectedCourse && (
        <CourseStudentsModal
          isDark={isDark}
          course={selectedCourse}
          onClose={() => setShowStudentsModal(false)}
        />
      )}

      <input type="file" hidden ref={coursesFileInputRef} onChange={() => {}} accept=".xlsx,.xls,.csv" />
    </div>
  );
}