import React, { useState } from "react";
import FormField from "../../shared/FormField";
import SelectField from "../../shared/SelectField";
import { createExam } from "../../../handlers/adminExamHandlers";

export default function CreateExamModal({ onClose, onSuccess, isDark }) {
    const [formData, setFormData] = useState({
        courseName: "",
        courseCode: "",
        lecturerEmail: "",
        examDate: "",
        examTime: "",
        duration: "120"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!formData.courseName || !formData.courseCode || !formData.lecturerEmail || !formData.examDate || !formData.examTime) {
                throw new Error("All fields are required");
            }

            await createExam(formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to create exam");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95 duration-200 ${isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                }`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        Create New Exam
                    </h2>
                    <button onClick={onClose} className={`text-2xl ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"}`}>
                        &times;
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm font-bold border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Course Code"
                            name="courseCode"
                            value={formData.courseCode}
                            onChange={handleChange}
                            placeholder="CS101"
                            isDark={isDark}
                            disabled={loading}
                        />
                        <FormField
                            label="Course Name"
                            name="courseName"
                            value={formData.courseName}
                            onChange={handleChange}
                            placeholder="Intro to CS"
                            isDark={isDark}
                            disabled={loading}
                        />
                    </div>

                    <FormField
                        label="Lecturer Email"
                        name="lecturerEmail"
                        type="email"
                        value={formData.lecturerEmail}
                        onChange={handleChange}
                        placeholder="lecturer@example.com"
                        isDark={isDark}
                        disabled={loading}
                    />

                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            label="Date"
                            name="examDate"
                            type="date"
                            value={formData.examDate}
                            onChange={handleChange}
                            isDark={isDark}
                            disabled={loading}
                        />
                        <FormField
                            label="Time"
                            name="examTime"
                            type="time"
                            value={formData.examTime}
                            onChange={handleChange}
                            isDark={isDark}
                            disabled={loading}
                        />
                        <FormField
                            label="Duration (min)"
                            name="duration"
                            type="number"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="120"
                            isDark={isDark}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className={`flex-1 py-2 rounded-xl font-bold transition-colors ${isDark
                                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? "Creating..." : "Create Exam"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
