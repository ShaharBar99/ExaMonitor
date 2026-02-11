import React, { useState, useEffect, useMemo } from "react";
import { examHandlers } from "../../../handlers/examHandlers"; // Need fetchAvailableExamLecturers, handleAddSubstituteLecturer

/**
 * Modal for adding a lecturer to a specific exam (e.g. substitute or additional).
 *
 * @param {object} props
 * @param {string} props.examId - The ID of the exam.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {Function} props.onAdded - Callback when a lecturer is successfully added.
 * @param {boolean} props.isDark - Theme mode.
 */
export default function AddExamLecturerModal({ examId, onClose, onAdded, isDark }) {
    const [available, setAvailable] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await examHandlers.fetchAvailableExamLecturers(examId);
            if (res.ok) setAvailable(res.data.lecturers || []);
            setLoading(false);
        }
        load();
    }, [examId]);

    const filtered = useMemo(() => {
        return available.filter(l =>
            (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.email || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [available, search]);

    const handleAdd = async (lecturer) => {
        try {
            await examHandlers.handleAddSubstituteLecturer(examId, lecturer.id);
            onAdded(lecturer);
            setAvailable(prev => prev.filter(l => l.id !== lecturer.id));
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-110 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? "bg-slate-800 text-white" : "bg-white"}`}>
                <div className="flex justify-between mb-4">
                    <h3 className="font-black">הוספת מרצה לבחינה</h3>
                    <button onClick={onClose}>&times;</button>
                </div>
                <input
                    type="text" placeholder="חיפוש לפי שם או אימייל..."
                    className={`w-full p-3 rounded-xl mb-4 border ${isDark ? "bg-slate-700 border-white/10" : "bg-slate-100"}`}
                    value={search} onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {loading ? <p className="text-center">טוען...</p> :
                        filtered.length > 0 ? filtered.map(l => (
                            <div key={l.id} className={`flex justify-between items-center p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                                <div>
                                    <span className="text-sm font-bold">{l.full_name}</span>
                                    <span className={`text-xs mr-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{l.email}</span>
                                </div>
                                <button onClick={() => handleAdd(l)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">הוסף</button>
                            </div>
                        )) : (
                            <p className={`text-center text-sm py-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>אין מרצים זמינים</p>
                        )}
                </div>
            </div>
        </div>
    );
}
