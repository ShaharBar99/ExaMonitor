import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../state/ThemeContext";
import { importExams, fetchExams, deleteExam } from "../../../handlers/adminExamHandlers";
import AdminTable from "../adminComponents/AdminTable";
import CreateExamModal from "../adminComponents/CreateExamModal";
import FormField from "../../shared/FormField";
import SelectField from "../../shared/SelectField";

export default function ManageExamsPage() {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);
    const [error, setError] = useState("");

    // Import State
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);
    const [importLoading, setImportLoading] = useState(false);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    // Busy state for row actions
    const [rowBusyId, setRowBusyId] = useState("");

    const loadExams = async () => {
        setLoading(true);
        try {
            const res = await fetchExams({ q: search, status });
            setExams(res?.items || []);
            setError("");
        } catch (err) {
            setError("Failed to load exams");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExams();
    }, [search, status]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setImportLoading(true);
        setImportResult(null);

        try {
            const res = await importExams(formData);
            const data = res.data || res;
            setImportResult(data);
            loadExams(); // Refresh list after import
        } catch (err) {
            setError(err.message || "Import failed");
        } finally {
            setImportLoading(false);
            e.target.value = ""; // reset input
        }
    };

    const handleDelete = async (examId) => {
        if (!window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) return;

        setRowBusyId(examId);
        try {
            await deleteExam(examId);
            setExams(prev => prev.filter(e => e.id !== examId));
        } catch (err) {
            alert("Failed to delete exam: " + err.message);
        } finally {
            setRowBusyId("");
        }
    };

    const columns = [
        { key: "course", header: "קוד קורס", className: "text-right" },
        { key: "name", header: "שם קורס", className: "text-right" },
        { key: "lecturer", header: "מרצה", className: "text-right" },
        { key: "date", header: "תאריך", className: "text-right" },
        { key: "time", header: "שעה", className: "text-right" },
        { key: "duration", header: "משך", className: "text-right" },
        { key: "status", header: "סטטוס", className: "text-right" },
        { key: "actions", header: "פעולות", className: "text-right" },
    ];

    return (
        <div className="animate-in fade-in duration-700 p-4 md:p-0">
            <div className="mb-6 px-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        ניהול מבחנים
                    </h1>
                    <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        רשימת המבחנים, יצירה וייבוא
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".xlsx,.xls,.csv"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importLoading}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm active:scale-95 ${importLoading ? "opacity-50 cursor-not-allowed" : ""
                                } ${isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {importLoading ? "טוען..." : "📥 ייבוא מאקסל"}
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm active:scale-95 bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
                        >
                            ➕ מבחן חדש
                        </button>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono text-left" dir="ltr">
                        Excel Headers: Lecturer Email | Course Code | Exam Date | Exam Time | Duration
                    </div>
                </div>
            </div>

            <div className={`backdrop-blur-md shadow-2xl rounded-[30px] md:rounded-3xl p-4 md:p-8 border transition-all ${isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200"
                }`}>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm font-bold border border-red-200">
                        {error}
                    </div>
                )}

                {/* Import Status Area */}
                {importResult && (
                    <div className={`mb-6 p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-sm">תוצאות ייבוא אחרון</h3>
                            <button onClick={() => setImportResult(null)} className="text-xs opacity-50 hover:opacity-100">סגור</button>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <span className="text-emerald-500 font-bold">הצלחה: {importResult.success}</span>
                            <span className="text-red-500 font-bold">כישלון: {importResult.failed}</span>
                        </div>
                        {importResult.errors?.length > 0 && (
                            <div className="mt-2 text-xs text-red-500 max-h-32 overflow-y-auto">
                                {importResult.errors.map((e, idx) => (
                                    <div key={idx}>Row {e.row}: {e.error}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <FormField
                        id="search"
                        label="חיפוש חופשי"
                        placeholder="שם קורס או קוד..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        isDark={isDark}
                    />
                    <SelectField
                        id="statusFilter"
                        label="סינון לפי סטטוס"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[
                            { value: "", label: "כל הסטטוסים" },
                            { value: "pending", label: "ממתין" },
                            { value: "active", label: "פעיל" },
                            { value: "finished", label: "הסתיים" },
                        ]}
                        isDark={isDark}
                    />
                </div>

                <AdminTable
                    columns={columns}
                    loading={loading}
                    isDark={isDark}
                    emptyText="לא נמצאו מבחנים"
                >
                    {exams.map((exam) => {
                        const dateObj = new Date(exam.date);
                        const dateStr = dateObj.toLocaleDateString('he-IL');
                        const timeStr = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <tr
                                key={exam.id}
                                className={`group transition-colors ${isDark ? "hover:bg-white/5 border-b border-white/5" : "hover:bg-slate-50 border-b border-slate-100"
                                    }`}
                            >
                                <td className={`px-4 py-3 text-right font-mono text-xs opacity-70 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                    {exam.course_code}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                                    {exam.course_name}
                                </td>
                                <td className={`px-4 py-3 text-right text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    <div>{exam.lecturer_name}</div>
                                    <div className="opacity-50 text-[10px]">{exam.lecturer_email}</div>
                                </td>
                                <td className={`px-4 py-3 text-right text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                    {dateStr}
                                </td>
                                <td className={`px-4 py-3 text-right text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                    {timeStr}
                                </td>
                                <td className={`px-4 py-3 text-right text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                    {exam.duration}דק'
                                </td>
                                <td className={`px-4 py-3 text-right`}>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${exam.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                        exam.status === 'finished' ? 'bg-slate-500/10 text-slate-500' :
                                            'bg-amber-500/10 text-amber-500' // pending
                                        }`}>
                                        {exam.status === 'active' ? 'פעיל' : exam.status === 'finished' ? 'הסתיים' : 'ממתין'}
                                    </span>
                                </td>
                                <td className={`px-4 py-3 text-right`}>
                                    <button
                                        onClick={() => handleDelete(exam.id)}
                                        disabled={rowBusyId === exam.id}
                                        className="text-lg opacity-50 hover:opacity-100 hover:scale-110 transition-all text-red-500"
                                        title="מחק מבחן"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </AdminTable>
            </div>

            {showCreateModal && (
                <CreateExamModal
                    isDark={isDark}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadExams();
                    }}
                />
            )}
        </div>
    );
}
