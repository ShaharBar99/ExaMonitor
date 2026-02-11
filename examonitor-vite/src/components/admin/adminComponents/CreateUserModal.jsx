import React, { useState, useEffect } from "react";
import FormField from "../../shared/FormField";
import { createNewUser, updateUser } from "../../../handlers/adminUserHandlers";
import { AUTH_ROLES } from "../../../handlers/authHandlers";

/**
 * Modal component for creating or editing a user.
 *
 * @param {object} props
 * @param {Function} props.onClose - Function to close the modal.
 * @param {Function} props.onSuccess - Function called on successful creation/update.
 * @param {boolean} props.isDark - Theme mode.
 * @param {object} [props.initialData] - Data for editing an existing user.
 */
export default function CreateUserModal({ onClose, onSuccess, isDark, initialData = null }) {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    role: "student",
    student_id: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        full_name: initialData.full_name || "",
        username: initialData.username || "",
        email: initialData.email || "",
        password: "", // Don't pre-fill password
        role: initialData.role || "student",
        student_id: initialData.student_id || "",
        is_active: initialData.is_active,
      });
    }
  }, [initialData, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || (!isEditing && !formData.password)) {
      return alert("Please fill required fields (Username, Email, Password).");
    }
    if (!isEditing && formData.role === 'student' && !formData.student_id) {
      return alert("Please provide a Student ID for the student.");
    }

    setLoading(true);
    try {
      let res;
      if (isEditing) {
        const updateData = {
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) {
          updateData.password = formData.password; // Only include if changed
        }
        res = await updateUser(initialData.id, updateData);
      } else {
        const createData = { ...formData };
        // Don't send student_id if not a student
        if (createData.role !== 'student') {
          delete createData.student_id;
        }
        res = await createNewUser(createData);
      }

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        throw new Error(res.apiError?.message || "An unknown error occurred");
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
          <h2 className="text-xl font-black">{isEditing ? "עריכת משתמש" : "יצירת משתמש חדש"}</h2>
          <button onClick={onClose} className="text-2xl opacity-50">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="שם מלא" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} isDark={isDark} />
          <FormField label="שם משתמש" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} isDark={isDark} required />
          <FormField label="אימייל" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} isDark={isDark} required />
          <FormField label="סיסמה" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} isDark={isDark} placeholder={isEditing ? "השאר ריק כדי לא לשנות" : ""} required={!isEditing} />

          {formData.role === 'student' && (
            isEditing ? (
              <div className="space-y-2">
                <label className="block text-sm font-bold opacity-70">מספר סטודנט</label>
                <p className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? "bg-slate-800/50 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                  {formData.student_id || "לא הוגדר"}
                </p>
              </div>
            ) : (
              <FormField 
                label="מספר סטודנט" 
                value={formData.student_id} 
                onChange={e => setFormData({...formData, student_id: e.target.value})} 
                isDark={isDark} required />
            )
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold">תפקיד</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"}`}>
                {AUTH_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold">סטטוס</label>
              <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})} className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"}`}>
                <option value={true}>פעיל</option>
                <option value={false}>לא פעיל</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
              {loading ? (isEditing ? "מעדכן..." : "יוצר...") : (isEditing ? "שמור שינויים" : "צור משתמש")}
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