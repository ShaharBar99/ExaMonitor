// src/pages/admin/ManageUsersPage.jsx

import React, { useEffect, useMemo, useState } from "react"; // React + hooks
import FormField from "../../shared/FormField"; // Input
import SelectField from "../../shared/SelectField"; // Select
import AdminTable from "../../admin/adminComponents/AdminTable"; // Table wrapper
import { changeUserRole, changeUserStatus, fetchUsers, filterUsers } from "../../../handlers/adminUserHandlers"; // Handlers
import { useAuth } from "../../state/AuthContext"; // Auth context
import { useNavigate } from "react-router-dom"; // Navigation
export default function ManageUsersPage() { // Page component
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // Users list
  const [loading, setLoading] = useState(false); // Loading
  const [error, setError] = useState(""); // Error
  const { user } = useAuth(); // Current user
  const [search, setSearch] = useState(""); // Search
  const [role, setRole] = useState(""); // Role filter
  const [status, setStatus] = useState(""); // Status filter

  const [rowBusyId, setRowBusyId] = useState(""); // Busy row

  useEffect(() => { // Load on mount
    let mounted = true; // Guard
    const run = async () => { // Fetch users
      setLoading(true); // Loading on
      setError(""); // Clear error
      try { // Fetch
        const res = await fetchUsers({}, {}, user?.id); // Mock/REST handled inside
        console.log('ManageUsersPage: fetchUsers res.data', res?.data); // Debug log
        if (!mounted) return; // Guard
        if (res.ok) setUsers(res.data.users || []); // Store
        else setError("Failed to load users"); // Fallback
      } catch (e) { // Error
        if (!mounted) return; // Guard
        setError(e?.message || "Failed to load users"); // Show
        navigate("/login"); // Navigate away on error
      } finally { // Done
        if (!mounted) return; // Guard
        setLoading(false); // Loading off
      } // End
    }; // End run
    run(); // Execute
    return () => { mounted = false; }; // Cleanup
  }, [user?.id]); // Once

  const filtered = useMemo(() => filterUsers(users, { search, role, status }), [users, search, role, status]); // Filter

  const roleOptions = useMemo(() => ([
    { value: "", label: "כל התפקידים" },
    { value: "student", label: "סטודנט" },
    { value: "supervisor", label: "משגיח" },
    { value: "floor_supervisor", label: "משגיח קומה" },
    { value: "lecturer", label: "מרצה" },
    { value: "admin", label: "מנהל מערכת" },
  ]), []); // Role options

  const statusOptions = useMemo(() => ([
    { value: "", label: "כל הסטטוסים" },
    { value: "active", label: "פעיל" },
    { value: "inactive", label: "לא פעיל" },
  ]), []); // Status options

  const columns = useMemo(() => ([
    { key: "name", header: "שם" },
    { key: "username", header: "שם משתמש" },
    { key: "role", header: "תפקיד" },
    { key: "status", header: "סטטוס" },
    { key: "actions", header: "פעולות" },
  ]), []); // Columns

  const roleLabel = (r) => { // Role label helper
    if (r === "student") return "סטודנט";
    if (r === "supervisor") return "משגיח";
    if (r === "floor_supervisor") return "משגיח קומה";
    if (r === "lecturer") return "מרצה";
    if (r === "admin") return "מנהל מערכת";
    return r;
  }; // End

  const statusLabel = (s) => { // Status label helper
    if (s === "active") return "פעיל";
    if (s === "inactive") return "לא פעיל";
    return s;
  }; // End

  const onChangeRowRole = async (userId, nextRole) => { // Change role
    setRowBusyId(userId); // Busy
    setError(""); // Clear
    try { // Update
      const res = await changeUserRole(userId, nextRole, {}); // Call handler
      const updated = res?.data?.user; // Updated user
      if (!updated) throw new Error("Update failed"); // Guard
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u))); // Update local
    } catch (e) { // Error
      setError(e?.message || "Failed to update role"); // Set
    } finally { // Done
      setRowBusyId(""); // Clear busy
    } // End
  }; // End

  const onToggleStatus = async (userId, currentStatus) => { // Toggle status
    const next = currentStatus === "active" ? "inactive" : "active"; // Next
    setRowBusyId(userId); // Busy
    setError(""); // Clear
    try { // Update
      const res = await changeUserStatus(userId, next, {}); // Call handler
      const updated = res?.data?.user; // Updated user
      if (!updated) throw new Error("Update failed"); // Guard
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u))); // Update local
    } catch (e) { // Error
      setError(e?.message || "Failed to update status"); // Set
    } finally { // Done
      setRowBusyId(""); // Clear busy
    } // End
  }; // End

  return ( // Render page (AdminLayout provides outer background/container)
    <div>
      <div className="mb-6"> {/* Header */}
        <h1 className="text-2xl font-extrabold text-white tracking-tight">ניהול משתמשים</h1>
        <p className="text-sm text-slate-300 mt-1">סינון, צפייה ועדכון משתמשים</p>
      </div>

      <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <FormField
            id="search"
            name="search"
            type="text"
            label="חיפוש"
            placeholder="חפש לפי שם או שם משתמש"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            error=""
            disabled={loading}
            autoComplete="off"
          />

          <SelectField
            id="roleFilter"
            name="roleFilter"
            label="תפקיד"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roleOptions}
            error=""
            disabled={loading}
          />

          <SelectField
            id="statusFilter"
            name="statusFilter"
            label="סטטוס"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            error=""
            disabled={loading}
          />
        </div>

        <AdminTable columns={columns} loading={loading} emptyText="לא נמצאו משתמשים" loadingText="טוען משתמשים...">
          {filtered.length === 0 ? null : (
            filtered.map((u) => (
              <tr key={u.id} className="bg-white">
                <td className="px-3 py-3 text-slate-900">{u.full_name}</td>
                <td className="px-3 py-3 text-slate-700">{u.username}</td>

                <td className="px-3 py-3">
                  <select
                    className="px-2 py-1 rounded-lg border border-slate-300 text-sm"
                    value={u.role}
                    disabled={rowBusyId === u.id}
                    onChange={(e) => onChangeRowRole(u.id, e.target.value)}
                  >
                    <option value="student">{roleLabel("student")}</option>
                    <option value="supervisor">{roleLabel("supervisor")}</option>
                    <option value="floor_supervisor">{roleLabel("floor_supervisor")}</option>
                    <option value="lecturer">{roleLabel("lecturer")}</option>
                    <option value="admin">{roleLabel("admin")}</option>
                  </select>
                </td>

                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                   {u.is_active ? "פעיל" : "לא פעיל"}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={rowBusyId === u.id}
                    onClick={() => onToggleStatus(u.id, u.is_active ? "active" : "inactive")}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition"
                  >
                    {u.is_active ? "השבת" : "הפעל"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </AdminTable>
      </div>
    </div>
  );
}
