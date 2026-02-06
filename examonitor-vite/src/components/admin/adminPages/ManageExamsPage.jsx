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
            loadExams();
        } catch (err) {
            setError(err.message || "Import failed");
        } finally {
            setImportLoading(false);
            e.target.value = "";
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
        <div className="animate-in fade-in duration-700 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        ניהול מבחנים
                    </h1>
                    <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        רשימת המבחנים, יצירה וייבוא
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importLoading}
                        className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all border shadow-sm active:scale-95 ${
                            isDark ? "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {importLoading ? "טוען..." : "📥 ייבוא"}
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                        ➕ מבחן חדש
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className={`mb-8 p-4 md:p-6 rounded-2xl border ${isDark ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>

            {/* Content Area */}
            <div className={`rounded-3xl border overflow-hidden transition-all ${isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
                
                {/* Desktop Table View (Hidden on Mobile) */}
                <div className="hidden md:block">
                    <AdminTable columns={columns} loading={loading} isDark={isDark} emptyText="לא נמצאו מבחנים">
                        {exams.map((exam) => {
                            const dateObj = new Date(exam.date);
                            const dateStr = dateObj.toLocaleDateString('he-IL');
                            const timeStr = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <tr key={exam.id} className={`group border-b last:border-0 ${isDark ? "hover:bg-white/5 border-white/5" : "hover:bg-slate-50 border-slate-100"}`}>
                                    <td className="px-6 py-4 text-right font-mono text-xs opacity-70">{exam.course_code}</td>
                                    <td className="px-6 py-4 text-right font-bold">{exam.course_name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-medium">{exam.lecturer_name}</div>
                                        <div className="text-[10px] opacity-50">{exam.lecturer_email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">{dateStr}</td>
                                    <td className="px-6 py-4 text-right text-sm font-mono">{timeStr}</td>
                                    <td className="px-6 py-4 text-right text-sm">{exam.duration} דק'</td>
                                    <td className="px-6 py-4 text-right">
                                        <StatusBadge status={exam.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(exam.id)} disabled={rowBusyId === exam.id} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all">🗑️</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </AdminTable>
                </div>

                {/* Mobile/Tablet Card View (Shown only on small screens) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                         <div className="p-10 text-center animate-pulse opacity-50">טוען מבחנים...</div>
                    ) : exams.length === 0 ? (
                        <div className="p-10 text-center opacity-50">לא נמצאו מבחנים</div>
                    ) : (
                        exams.map((exam) => {
                            const dateObj = new Date(exam.date);
                            return (
                                <div key={exam.id} className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{exam.course_code}</span>
                                            <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{exam.course_name}</h3>
                                            <p className="text-xs opacity-60 mt-1">מרצה: {exam.lecturer_name}</p>
                                        </div>
                                        <StatusBadge status={exam.status} />
                                    </div>
                                    
                                    <div className={`grid grid-cols-2 gap-4 p-3 rounded-xl text-xs font-medium ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                                        <div>📅 {new Date(exam.date).toLocaleDateString('he-IL')}</div>
                                        <div>🕒 {new Date(exam.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div>⏳ {exam.duration} דקות</div>
                                        <button 
                                            onClick={() => handleDelete(exam.id)}
                                            className="text-red-500 font-bold flex items-center gap-1"
                                        >
                                            🗑️ מחק מבחן
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showCreateModal && (
                <CreateExamModal
                    isDark={isDark}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={loadExams}
                />
            )}
        </div>
    );
}

// Sub-component for cleaner status rendering
const StatusBadge = ({ status }) => (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
        status === 'finished' ? 'bg-slate-500/10 text-slate-500' :
        'bg-amber-500/10 text-amber-500'
    }`}>
        {status === 'active' ? 'פעיל' : status === 'finished' ? 'הסתיים' : 'ממתין'}
    </span>
);