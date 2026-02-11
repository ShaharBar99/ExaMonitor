import React, { useState, useEffect } from "react";
import { fetchCourseLecturers, removeLecturerFromCourseHandler } from "../../../handlers/courseHandlers";
import AddLecturerModal from "./AddLecturerModal";

/**
 * Modal for managing lecturers assigned to a course.
 *
 * @param {object} props
 * @param {object} props.course - The course object.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {boolean} props.isDark - Theme mode.
 */
export default function ManageLecturersModal({ course, onClose, isDark }) {
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadLecturers = async () => {
        setLoading(true);
        try {
            const res = await fetchCourseLecturers(course.id);
            if (res.ok) setLecturers(res.data.lecturers || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadLecturers(); }, [course.id]);

    const handleRemove = async (lecturerId) => {
        if (!window.confirm("להסיר מרצה מהקורס?")) return;
        try {
            await removeLecturerFromCourseHandler(course.id, lecturerId);
            setLecturers(prev => prev.filter(l => l.id !== lecturerId));
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border border-white/10 text-white" : "bg-white"}`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black">{course.course_name}</h2>
                        <p className="text-xs opacity-60">ניהול רשימת מרצים</p>
                    </div>
                    <button onClick={onClose} className="text-xl">&times;</button>
                </div>

                <div className="p-4">
                    <button onClick={() => setShowAddModal(true)} className="w-full p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-500 font-bold text-xs">➕ הוספת מרצה</button>
                </div>

                {showAddModal && <AddLecturerModal courseId={course.id} isDark={isDark} onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); loadLecturers(); }} />}

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? <p className="text-center animate-pulse p-10">טוען...</p> :
                        lecturers.length > 0 ? lecturers.map(l => (
                            <div key={l.id} className={`flex justify-between items-center p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                                <div className="text-sm">
                                    <p className="font-bold">{l.full_name}</p>
                                    <p className="opacity-50 text-xs">{l.email}</p>
                                </div>
                                <button onClick={() => handleRemove(l.id)} className="text-red-500 text-xs font-black">הסר</button>
                            </div>
                        )) : (
                            <p className={`text-center py-10 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>אין מרצים משויכים לקורס</p>
                        )
                    }
                </div>
            </div>
        </div>
    );
}
