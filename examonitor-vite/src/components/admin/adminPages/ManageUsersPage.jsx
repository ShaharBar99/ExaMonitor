// src/pages/admin/ManageUsersPage.jsx

import React, { useEffect, useMemo, useState } from "react"; 
import FormField from "../../shared/FormField"; 
import SelectField from "../../shared/SelectField"; 
import AdminTable from "../../admin/adminComponents/AdminTable"; 
import { changeUserRole, changeUserStatus, fetchUsers, filterUsers } from "../../../handlers/adminUserHandlers"; 
import { useAuth } from "../../state/AuthContext"; 
import { useTheme } from "../../state/ThemeContext"; // ייבוא ה-Theme
import { useNavigate } from "react-router-dom"; 

export default function ManageUsersPage() { 
  const navigate = useNavigate();
  const { isDark } = useTheme(); // שימוש בערכת הנושא
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(""); 
  const { user } = useAuth(); 
  const [search, setSearch] = useState(""); 
  const [role, setRole] = useState(""); 
  const [status, setStatus] = useState(""); 
  const [rowBusyId, setRowBusyId] = useState(""); 

  useEffect(() => { 
    let mounted = true; 
    const run = async () => { 
      setLoading(true); 
      setError(""); 
      try { 
        const res = await fetchUsers({}, {}, user?.id); 
        if (!mounted) return; 
        if (res.ok) setUsers(res.data.users || []); 
        else setError("Failed to load users"); 
      } catch (e) { 
        if (!mounted) return; 
        setError(e?.message || "Failed to load users"); 
        navigate("/login"); 
      } finally { 
        if (!mounted) return; 
        setLoading(false); 
      } 
    }; 
    run(); 
    return () => { mounted = false; }; 
  }, [user?.id, navigate]); 

  const filtered = useMemo(() => filterUsers(users, { search, role, status }), [users, search, role, status]);

  const roleOptions = useMemo(() => ([
    { value: "", label: "כל התפקידים" },
    { value: "student", label: "סטודנט" },
    { value: "supervisor", label: "משגיח" },
    { value: "floor_supervisor", label: "משגיח קומה" },
    { value: "lecturer", label: "מרצה" },
    { value: "admin", label: "מנהל מערכת" },
  ]), []);

  const statusOptions = useMemo(() => ([
    { value: "", label: "כל הסטטוסים" },
    { value: "active", label: "פעיל" },
    { value: "inactive", label: "לא פעיל" },
  ]), []);

  const columns = useMemo(() => ([
    { key: "name", header: "שם מלא" },
    { key: "username", header: "שם משתמש" },
    { key: "role", header: "שינוי תפקיד" },
    { key: "status", header: "סטטוס" },
    { key: "actions", header: "ניהול" },
  ]), []);

  // ... (המשך פונקציות העזר onChangeRowRole ו-onToggleStatus ללא שינוי לוגי)

  const onChangeRowRole = async (userId, nextRole) => {
    setRowBusyId(userId);
    setError("");
    try {
      const res = await changeUserRole(userId, nextRole, {});
      const updated = res?.data?.user;
      if (!updated) throw new Error("Update failed");
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError(e?.message || "Failed to update role");
    } finally {
      setRowBusyId("");
    }
  };

  const onToggleStatus = async (userId, currentStatus) => {
    const next = currentStatus === "active" ? "inactive" : "active";
    setRowBusyId(userId);
    setError("");
    try {
      const res = await changeUserStatus(userId, next, {});
      const updated = res?.data?.user;
      if (!updated) throw new Error("Update failed");
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError(e?.message || "Failed to update status");
    } finally {
      setRowBusyId("");
    }
  };

  return ( 
    <div className="animate-in fade-in duration-700">
      <div className="mb-6 px-1">
        <h1 className={`text-2xl font-black tracking-tight transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
          ניהול משתמשים
        </h1>
        <p className={`text-sm mt-1 font-medium transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          ניהול הרשאות, עדכון תפקידים ובקרת גישה למערכת
        </p>
      </div>

      <div className={`backdrop-blur-md shadow-2xl rounded-3xl p-6 border transition-all duration-300 ${
        isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200"
      }`}>
        
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <FormField
            id="search"
            label="חיפוש חופשי"
            placeholder="שם או שם משתמש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            isDark={isDark}
            autoComplete="off"
          />

          <SelectField
            id="roleFilter"
            label="סינון לפי תפקיד"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roleOptions}
            disabled={loading}
            isDark={isDark}
          />

          <SelectField
            id="statusFilter"
            label="סינון לפי סטטוס"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            disabled={loading}
            isDark={isDark}
          />
        </div>

        <AdminTable columns={columns} loading={loading} isDark={isDark} emptyText="לא נמצאו משתמשים">
          {filtered.map((u) => (
            <tr key={u.id} className={`transition-colors border-b last:border-0 ${
              isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"
            }`}>
              <td className={`px-4 py-4 font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                {u.full_name}
              </td>
              <td className={`px-4 py-4 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {u.username}
              </td>

              <td className="px-4 py-4">
                <select
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all outline-none ${
                    isDark 
                      ? "bg-slate-800 border-white/5 text-blue-400 focus:border-blue-500/50" 
                      : "bg-slate-50 border-slate-200 text-blue-700 focus:border-blue-400"
                  } disabled:opacity-50`}
                  value={u.role}
                  disabled={rowBusyId === u.id}
                  onChange={(e) => onChangeRowRole(u.id, e.target.value)}
                >
                  <option value="student">סטודנט</option>
                  <option value="supervisor">משגיח</option>
                  <option value="floor_supervisor">משגיח קומה</option>
                  <option value="lecturer">מרצה</option>
                  <option value="admin">מנהל מערכת</option>
                </select>
              </td>

              <td className="px-4 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  u.is_active 
                    ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700")
                    : (isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")
                }`}>
                  {u.is_active ? "פעיל" : "לא פעיל"}
                </span>
              </td>

              <td className="px-4 py-4">
                <button
                  type="button"
                  disabled={rowBusyId === u.id}
                  onClick={() => onToggleStatus(u.id, u.is_active ? "active" : "inactive")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    u.is_active
                      ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"
                      : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                  } disabled:opacity-50`}
                >
                  {rowBusyId === u.id ? "מעדכן..." : (u.is_active ? "השבת חשבון" : "הפעל חשבון")}
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}