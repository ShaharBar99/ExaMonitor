import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../../state/ThemeContext";
import { fetchExams, deleteExam, importExams } from "../../../handlers/adminExamHandlers";
import CreateExamModal from "../adminComponents/CreateExamModal";
import AdminTable from "../adminComponents/AdminTable";
import ManageExamLecturersModal from "../adminComponents/ManageExamLecturersModal";

export default function ManageExamsPage() {
  const { isDark } = useTheme();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowBusyId, setRowBusyId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLecturersModal, setShowLecturersModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedLecturerExam, setSelectedLecturerExam] = useState(null);
  const fileInputRef = useRef(null);

  const loadExams = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.q = search;
      if (statusFilter) filters.status = statusFilter;
      const data = await fetchExams(filters);
      setExams(data.items || []);
    } catch (err) {
      console.error("Failed to load exams", err);
      alert("שגיאה בטעינת הבחינות");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExams();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingExam(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExam(exam);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setEditingExam(null);
    setShowCreateModal(false);
  };

  const handleSuccess = () => {
    handleCloseModal();
    loadExams();
  };

  const handleOpenLecturers = (exam) => {
    setSelectedLecturerExam(exam);
    setShowLecturersModal(true);
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק בחינה זו? פעולה זו אינה הפיכה.")) return;
    setRowBusyId(examId);
    try {
      await deleteExam(examId);
      loadExams();
    } catch (err) {
      alert(`שגיאה במחיקת הבחינה: ${err.message}`);
    } finally {
      setRowBusyId(null);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await importExams(formData);
      alert(`יובאו בהצלחה: ${res.success}, נכשלו: ${res.failed}`);
      loadExams();
    } catch (err) {
      alert(`שגיאה בייבוא: ${err.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const columns = [
    { key: "course", header: "קורס" },
    { key: "date", header: "תאריך ושעה" },
    { key: "duration", header: "משך" },
    { key: "status", header: "סטטוס" },
    { key: "actions", header: "פעולות" },
  ];

  return (
    <div className={`min-h-screen pb-20 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">ניהול בחינות</h1>
            <p className="text-sm mt-1 opacity-70">יצירה, עריכה ומחיקה של בחינות.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <input type="file" hidden ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" />
              <button onClick={() => fileInputRef.current?.click()} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${isDark ? "bg-slate-800 border-white/10 text-green-400" : "bg-white border-green-200 text-green-600"}`}>
                📥 ייבוא
              </button>
              <button
                onClick={handleOpenCreate}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                + בחינה חדשה
              </button>
            </div>
            <div className="text-[11px] text-slate-500 text-right">פורמט: course_code | date | time | duration | lecturer_email</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="חיפוש לפי שם קורס או קוד..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pr-12 pl-4 py-3.5 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}
          >
            <option value="">כל הסטטוסים</option>
            <option value="pending">ממתין</option>
            <option value="active">פעיל</option>
            <option value="finished">הסתיים</option>
          </select>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/5 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"}`}>
          <div className="hidden md:block">
            <AdminTable columns={columns} loading={loading} isDark={isDark}>
              {exams.map((exam) => (
                <tr key={exam.id} className={`border-t transition-colors ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold">{exam.course_name}</div>
                    <div className="text-xs opacity-70 font-mono">{exam.course_code}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(exam.date).toLocaleString('he-IL')}</td>
                  <td className="px-6 py-4 text-sm">{exam.duration} דקות</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${exam.status === 'active' ? 'bg-green-500/10 text-green-500' :
                      exam.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleOpenEdit(exam)} className="px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold text-xs transition-all">ערוך</button>
                      <button onClick={() => handleOpenLecturers(exam)} className="px-4 py-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 font-bold text-xs transition-all">שיבוץ מרצים</button>
                      <button onClick={() => handleDelete(exam.id)} disabled={rowBusyId === exam.id} className="px-4 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-xs transition-all">מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            {exams.map((exam) => (
              <div key={exam.id} className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-white/5" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">{exam.course_name}</div>
                    <div className="text-xs opacity-70 font-mono">{exam.course_code}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${exam.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    exam.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                    {exam.status}
                  </span>
                </div>

                <div className="text-sm space-y-1 mb-4 opacity-80">
                  <div>📅 {new Date(exam.date).toLocaleString('he-IL')}</div>
                  <div>⏱️ {exam.duration} דקות</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(exam)} className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">ערוך</button>
                  <button onClick={() => handleOpenLecturers(exam)} className="flex-1 py-2 rounded-lg bg-purple-500/10 text-purple-500 font-bold text-xs">שיבוץ מרצים</button>
                  <button onClick={() => handleDelete(exam.id)} disabled={rowBusyId === exam.id} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 font-bold text-xs">מחק</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateExamModal
          isDark={isDark}
          initialData={editingExam}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}

      {showLecturersModal && selectedLecturerExam && (
        <ManageExamLecturersModal
          isDark={isDark}
          exam={selectedLecturerExam}
          onClose={() => setShowLecturersModal(false)}
        />
      )}
    </div>
  );
}