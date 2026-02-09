import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../../state/ThemeContext";
import { fetchUsers, deleteUser, importUsers } from "../../../handlers/adminUserHandlers";
import CreateUserModal from "../adminComponents/CreateUserModal";
import AdminTable from "../adminComponents/AdminTable";
import { AUTH_ROLES } from "../../../handlers/authHandlers";

export default function ManageUsersPage() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowBusyId, setRowBusyId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const fileInputRef = useRef(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await fetchUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users", err);
      alert("שגיאה בטעינת המשתמשים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setShowCreateModal(false);
  };

  const handleSuccess = () => {
    handleCloseModal();
    loadUsers();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה? פעולה זו אינה הפיכה.")) return;
    setRowBusyId(userId);
    try {
      await deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(`שגיאה במחיקת המשתמש: ${err.message}`);
    } finally {
      setRowBusyId(null);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await importUsers(formData);
      alert(`יובאו בהצלחה: ${res.data.success}, נכשלו: ${res.data.failed}`);
      loadUsers();
    } catch (err) {
      alert(`שגיאה בייבוא: ${err.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = search.toLowerCase();
      const nameMatch = user.full_name?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      const usernameMatch = user.username?.toLowerCase().includes(searchLower);
      const roleMatch = !roleFilter || user.role === roleFilter;
      const statusMatch = !statusFilter || (user.is_active ? 'active' : 'inactive') === statusFilter;
      return (nameMatch || emailMatch || usernameMatch) && roleMatch && statusMatch;
    });
  }, [users, search, roleFilter, statusFilter]);

  const columns = [
    { key: "name", header: "שם" },
    { key: "email", header: "אימייל" },
    { key: "role", header: "תפקיד" },
    { key: "status", header: "סטטוס" },
    { key: "actions", header: "פעולות" },
  ];

  return (
    <div className={`min-h-screen pb-20 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">ניהול משתמשים</h1>
            <p className="text-sm mt-1 opacity-70">יצירה, עריכה וניהול הרשאות של משתמשים.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <input type="file" hidden ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" />
              <button onClick={() => fileInputRef.current?.click()} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${isDark ? "bg-slate-800 border-white/10 text-green-400" : "bg-white border-green-200 text-green-600"}`}>
                📥 ייבוא
              </button>
              <button
                onClick={handleOpenCreate}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                + משתמש חדש
              </button>
            </div>
            <div className="text-[11px] text-slate-500 text-right">
              פורמט: <span className="font-mono">username | email | password | full_name | role | student_id</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="חיפוש לפי שם, אימייל או שם משתמש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pr-12 pl-4 py-3.5 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}>
            <option value="">כל התפקידים</option>
            {AUTH_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-200"}`}>
            <option value="">כל הסטטוסים</option>
            <option value="active">פעיל</option>
            <option value="inactive">לא פעיל</option>
          </select>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/5 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"}`}>
          <div className="hidden md:block">
            <AdminTable columns={columns} loading={loading} isDark={isDark}>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`border-t transition-colors ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold">{user.full_name || user.username}</div>
                    <div className="text-xs opacity-70 font-mono">@{user.username}</div>
                    {user.role === 'student' && user.student_id && (
                      <div className="text-xs opacity-50 font-mono mt-1">ID: {user.student_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.is_active ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                      {user.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleOpenEdit(user)} className="px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold text-xs transition-all">ערוך</button>
                      <button onClick={() => handleDelete(user.id)} disabled={rowBusyId === user.id} className="px-4 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-xs transition-all">מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-white/5" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">{user.full_name || user.username}</div>
                    <div className="text-xs opacity-70 font-mono">@{user.username}</div>
                    {user.role === 'student' && user.student_id && (
                      <div className="text-xs opacity-50 font-mono mt-1">ID: {user.student_id}</div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.is_active ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                    {user.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
                
                <div className="text-sm space-y-1 mb-4 opacity-80">
                  <div>📧 {user.email}</div>
                  <div>👤 {user.role}</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(user)} className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">ערוך</button>
                  <button onClick={() => handleDelete(user.id)} disabled={rowBusyId === user.id} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 font-bold text-xs">מחק</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          isDark={isDark}
          initialData={editingUser}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}