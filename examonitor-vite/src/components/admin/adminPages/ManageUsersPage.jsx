import React, { useEffect, useMemo, useState, useRef } from "react";
import FormField from "../../shared/FormField";
import SelectField from "../../shared/SelectField";
import AdminTable from "../../admin/adminComponents/AdminTable";
import { changeUserRole, changeUserStatus, fetchUsers, filterUsers, deleteUser } from "../../../handlers/adminUserHandlers"; // Added deleteUser
import { useAuth } from "../../state/AuthContext";
import { useTheme } from "../../state/ThemeContext";
import { useNavigate } from "react-router-dom";
import CreateUserModal from "../adminComponents/CreateUserModal";
import { importUsers } from "../../../handlers/adminUserHandlers";

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [rowBusyId, setRowBusyId] = useState("");
  const fileInputRef = useRef(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({}, {}, user?.id);
      if (res.ok) setUsers(res.data.users || []);
    } catch (e) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      await importUsers(formData);
      await loadUsers(); // refresh table
    } catch (err) {
      setError(err.message || "ייבוא נכשל");
    } finally {
      setLoading(false);
      e.target.value = ""; // reset input
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    setRowBusyId(userId);
    try {
      await deleteUser(userId, { token: localStorage.getItem('token') }); // Ensure token is passed if needed, though handler does it
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    } finally {
      setRowBusyId("");
    }
  };

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

  const columns = useMemo(() => ([
    { key: "name", header: "שם מלא" },
    { key: "username", header: "שם משתמש" },
    { key: "role", header: "תפקיד" },
    { key: "status", header: "סטטוס" },
    { key: "actions", header: "ניהול" },
    { key: "delete", header: "מחיקה" }, // Added delete column
  ]), []);

  const onChangeRowRole = async (userId, nextRole) => {
    setRowBusyId(userId);
    try {
      const res = await changeUserRole(userId, nextRole, {});
      const updated = res?.data?.user;
      if (updated) setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError("עדכון תפקיד נכשל");
    } finally {
      setRowBusyId("");
    }
  };

  const onToggleStatus = async (userId, currentStatus) => {
    const next = currentStatus === "active" ? "inactive" : "active";
    setRowBusyId(userId);
    try {
      const res = await changeUserStatus(userId, next, {});
      const updated = res?.data?.user;
      if (updated) setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError("עדכון סטטוס נכשל");
    } finally {
      setRowBusyId("");
    }
  };

  return (
    <div className="animate-in fade-in duration-700 p-4 md:p-0">
      <div className="mb-6 px-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            ניהול משתמשים
          </h1>
          <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            ניהול הרשאות, עדכון תפקידים ובקרת גישה
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
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isDark
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              📥 ייבוא מאקסל
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              + הוסף משתמש
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            פורמט קובץ Excel:
            <span className="font-mono ml-1">
              username | email | password | role | full_name
            </span>
          </div>
        </div>

      </div>

      <div className={`backdrop-blur-md shadow-2xl rounded-[30px] md:rounded-3xl p-4 md:p-8 border transition-all ${isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200"
        }`}>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-bold">
            {error}
          </div>
        )}

        {/* Responsive Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <FormField
            id="search"
            label="חיפוש חופשי"
            placeholder="שם או שם משתמש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            isDark={isDark}
          />
          <SelectField
            id="roleFilter"
            label="סינון לפי תפקיד"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: "", label: "כל התפקידים" },
              { value: "student", label: "סטודנט" },
              { value: "supervisor", label: "משגיח" },
              { value: "floor_supervisor", label: "משגיח קומה" },
              { value: "lecturer", label: "מרצה" },
              { value: "admin", label: "מנהל מערכת" },
            ]}
            isDark={isDark}
          />
          <SelectField
            id="statusFilter"
            label="סינון לפי סטטוס"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "כל הסטטוסים" },
              { value: "active", label: "פעיל" },
              { value: "inactive", label: "לא פעיל" },
            ]}
            isDark={isDark}
          />
        </div>

        <AdminTable columns={columns} loading={loading} isDark={isDark} emptyText="לא נמצאו משתמשים">
          {filtered.map((u) => (
            <tr key={u.id} className={`flex flex-col md:table-row transition-colors border-b last:border-0 p-4 md:p-0 ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"
              }`}>

              {/* Full Name */}
              <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">שם מלא</span>
                <div className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                  {u.full_name}
                </div>
              </td>

              {/* Username */}
              <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">שם משתמש</span>
                <div className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {u.username}
                </div>
              </td>

              {/* Role Change - Full width on mobile */}
              <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">שינוי תפקיד</span>
                <select
                  className={`w-full md:w-auto px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all outline-none ${isDark
                    ? "bg-slate-800 border-white/5 text-blue-400 focus:border-blue-500/50"
                    : "bg-slate-50 border-slate-200 text-blue-700 focus:border-blue-400"
                    }`}
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

              {/* Status Badge */}
              <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">סטטוס</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${u.is_active
                  ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700")
                  : (isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")
                  }`}>
                  {u.is_active ? "פעיל" : "לא פעיל"}
                </span>
              </td>

              {/* Action Button - Full width on mobile */}
              <td className="px-0 md:px-4 py-4 block md:table-cell">
                <button
                  type="button"
                  disabled={rowBusyId === u.id}
                  onClick={() => onToggleStatus(u.id, u.is_active ? "active" : "inactive")}
                  className={`w-full md:w-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.is_active
                    ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"
                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                    } disabled:opacity-50`}
                >
                  {rowBusyId === u.id && u.id !== rowBusyId ? "..." : (u.is_active ? "השבת חשבון" : "הפעל חשבון")}
                </button>
              </td>

              {/* Delete Button */}
              <td className="px-0 md:px-4 py-4 block md:table-cell text-center md:text-right">
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={rowBusyId === u.id}
                  className="text-lg opacity-50 hover:opacity-100 hover:scale-110 transition-all text-red-500"
                  title="מחק משתמש"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadUsers}
          isDark={isDark}
        />
      )}
    </div>
  );
}