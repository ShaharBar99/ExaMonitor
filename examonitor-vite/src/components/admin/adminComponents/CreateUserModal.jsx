import React, { useState } from "react";
import FormField from "../../shared/FormField";
import SelectField from "../../shared/SelectField";
import { createNewUser } from "../../../handlers/adminUserHandlers";

export default function CreateUserModal({ onClose, onSuccess, isDark }) {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "student",
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
            if (!formData.name || !formData.username || !formData.email || !formData.password) {
                throw new Error("All fields are required");
            }

            await createNewUser(formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 ${isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                }`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        Create New User
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
                    <FormField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        isDark={isDark}
                        disabled={loading}
                    />
                    <FormField
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="johndoe"
                        isDark={isDark}
                        disabled={loading}
                    />
                    <FormField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        isDark={isDark}
                        disabled={loading}
                    />
                    <FormField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="******"
                        isDark={isDark}
                        disabled={loading}
                    />
                    <SelectField
                        label="Role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        options={[
                            { value: "student", label: "Student" },
                            { value: "supervisor", label: "Supervisor" },
                            { value: "floor_supervisor", label: "Floor Supervisor" },
                            { value: "lecturer", label: "Lecturer" },
                            { value: "admin", label: "Admin" },
                        ]}
                        isDark={isDark}
                        disabled={loading}
                    />

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
                            {loading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
