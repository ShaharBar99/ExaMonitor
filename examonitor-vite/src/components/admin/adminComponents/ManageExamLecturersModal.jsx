import React, { useState, useEffect } from "react";
import { examHandlers } from "../../../handlers/examHandlers"; // Need loadExamLecturers, handleRemoveSubstituteLecturer
import AddExamLecturerModal from "./AddExamLecturerModal";
import { examsApi } from "../../../api/examsApi"; // To get full user names we might need listUsers or just rely on loadExamLecturers if it returns profiles?
// examsApi.getExamLecturers returns { lecturerIds: [...] } only IDs!
// Wait, examService.listExamLecturers returns IDs. 
// But examService.listCourseLecturers returns profiles. 
// I need profiles for names. 
// Let's check `examService.js` listExamLecturers implementation again. 
// It returns IDs only: .select('lecturer_id'). 
// I need to update examService/Controller/Route to return profiles or fetch profiles in frontend.
// Ah, allow me to update examService.listExamLecturers to return profiles like listCourseLecturers does.

// ACTUALLY, I will use `listCourseLecturers` pattern: 
/*
  async listCourseLecturers(courseId) {
    const { data, error } = await supabaseAdmin
      .from('course_lecturers')
      .select(`
      lecturer_id,
      profiles:lecturer_id (
        id,
        full_name,
        email
      )
    `)
    ...
*/
// I should update `examService.listExamLecturers` to do the same.

/**
 * Modal for managing lecturers assigned to a specific exam.
 * Allows adding and removing lecturers.
 *
 * @param {object} props
 * @param {object} props.exam - The exam object.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {boolean} props.isDark - Theme mode.
 */
export default function ManageExamLecturersModal({ exam, onClose, isDark }) {
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Helper to load profiles logic (temporarily handling the ID vs Profile issue in frontend if I don't update backend yet, 
    // but better to update backend. For now I will assume I update backend or use a workaround).
    // Let's implement this assuming I will update the backend to return profiles next.

    const loadLecturers = async () => {
        setLoading(true);
        try {
            // I need a handler that returns profiles. 
            // examHandlers.loadExamLecturers returns IDs currently. 
            // I'll update that too.
            const idsOrProfiles = await examHandlers.loadExamLecturers(exam.id);
            setLecturers(idsOrProfiles || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadLecturers(); }, [exam.id]);

    const handleRemove = async (lecturerId) => {
        if (!window.confirm("להסיר מרצה מהבחינה?")) return;
        try {
            await examHandlers.handleRemoveSubstituteLecturer(exam.id, lecturerId);
            setLecturers(prev => prev.filter(l => l.id !== lecturerId));
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border border-white/10 text-white" : "bg-white"}`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black">{exam.course_name}</h2>
                        <p className="text-xs opacity-60">ניהול רשימת מרצים לבחינה</p>
                    </div>
                    <button onClick={onClose} className="text-xl">&times;</button>
                </div>

                <div className="p-4">
                    <button onClick={() => setShowAddModal(true)} className="w-full p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-500 font-bold text-xs">➕ הוספת מרצה</button>
                </div>

                {showAddModal && <AddExamLecturerModal examId={exam.id} isDark={isDark} onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); loadLecturers(); }} />}

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? <p className="text-center animate-pulse p-10">טוען...</p> :
                        lecturers.length > 0 ? lecturers.map(l => (
                            <div key={l.id} className={`flex justify-between items-center p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                                <div className="text-sm">
                                    <p className="font-bold">{l.full_name || l.name || 'Unknown'}</p>
                                    <p className="opacity-50 text-xs">{l.email}</p>
                                </div>
                                <button onClick={() => handleRemove(l.id)} className="text-red-500 text-xs font-black">הסר</button>
                            </div>
                        )) : (
                            <p className={`text-center py-10 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>אין מרצים משויכים לבחינה</p>
                        )
                    }
                </div>
            </div>
        </div>
    );
}
