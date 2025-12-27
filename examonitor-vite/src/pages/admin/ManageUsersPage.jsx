// src/pages/admin/ManageUsersPage.jsx

import React, { useEffect, useMemo, useState } from "react"; // React + hooks
import FormField from "../../components/shared/FormField"; // Reusable input field
import SelectField from "../../components/shared/SelectField"; // Reusable select field

import { // Import admin handlers
  changeUserRole, // Change role handler
  changeUserStatus, // Change status handler
  fetchUsers, // Fetch users handler
  filterUsers, // Pure filter function
} from "../../handlers/adminUserHandlers"; // From admin handlers module

export default function ManageUsersPage() { // Admin manage users page
  const [users, setUsers] = useState([]); // Full users list
  const [loading, setLoading] = useState(false); // Loading flag
  const [error, setError] = useState(""); // Error message

  const [search, setSearch] = useState(""); // Search filter
  const [role, setRole] = useState(""); // Role filter (empty = all)
  const [status, setStatus] = useState(""); // Status filter (empty = all)

  const [rowBusyId, setRowBusyId] = useState(""); // Track which row is being updated

  useEffect(() => { // Fetch users on mount
    let isMounted = true; // Prevent state updates after unmount
    const run = async () => { // Async fetch function
      setLoading(true); // Start loading
      setError(""); // Clear error
      try { // Try fetch
        const res = await fetchUsers({}, {}); // Call handler (mock/REST handled inside api)
        if (!isMounted) return; // Stop if unmounted
        if (res.ok) setUsers(res.data.users); // Save users
        else setError("Failed to load users"); // Fallback error
      } catch (e) { // Catch errors
        if (!isMounted) return; // Stop if unmounted
        setError(e?.message || "Failed to load users"); // Store error
      } finally { // Always
        if (!isMounted) return; // Stop if unmounted
        setLoading(false); // Stop loading
      } // End try/catch/finally
    }; // End run
    run(); // Execute fetch
    return () => { // Cleanup on unmount
      isMounted = false; // Mark unmounted
    }; // End cleanup
  }, []); // Run only once

  const filtered = useMemo(() => { // Compute filtered list
    return filterUsers(users, { search, role, status }); // Filter using pure function
  }, [users, search, role, status]); // Dependencies

  const roleOptions = useMemo(() => { // Role filter dropdown options
    return [ // Return options
      { value: "", label: "כל התפקידים" }, // All
      { value: "student", label: "סטודנט" }, // Student
      { value: "invigilator", label: "משגיח" }, // Invigilator
      { value: "lecturer", label: "מרצה" }, // Lecturer
      { value: "admin", label: "מנהל מערכת" }, // Admin
    ]; // End options
  }, []); // No deps

  const statusOptions = useMemo(() => { // Status filter dropdown options
    return [ // Return options
      { value: "", label: "כל הסטטוסים" }, // All
      { value: "active", label: "פעיל" }, // Active
      { value: "inactive", label: "לא פעיל" }, // Inactive
    ]; // End options
  }, []); // No deps

  const onChangeRowRole = async (userId, nextRole) => { // Handle changing role for a user
    setRowBusyId(userId); // Mark row busy
    setError(""); // Clear error
    try { // Try update
      const res = await changeUserRole(userId, nextRole, {}); // Call handler
      const updated = res?.data?.user; // Get updated user from response
      if (!updated) throw new Error("Update failed"); // Guard
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u))); // Update local list
    } catch (e) { // Catch error
      setError(e?.message || "Failed to update role"); // Set error
    } finally { // Always
      setRowBusyId(""); // Clear busy
    } // End try/catch/finally
  }; // End onChangeRowRole

  const onToggleStatus = async (userId, currentStatus) => { // Toggle active/inactive
    const next = currentStatus === "active" ? "inactive" : "active"; // Compute next status
    setRowBusyId(userId); // Mark row busy
    setError(""); // Clear error
    try { // Try update
      const res = await changeUserStatus(userId, next, {}); // Call handler
      const updated = res?.data?.user; // Get updated user
      if (!updated) throw new Error("Update failed"); // Guard
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u))); // Update local list
    } catch (e) { // Catch
      setError(e?.message || "Failed to update status"); // Error message
    } finally { // Always
      setRowBusyId(""); // Clear busy
    } // End try/catch/finally
  }; // End onToggleStatus

  const roleLabel = (r) => { // Convert role to Hebrew label
    if (r === "student") return "סטודנט"; // Student
    if (r === "invigilator") return "משגיח"; // Invigilator
    if (r === "lecturer") return "מרצה"; // Lecturer
    if (r === "admin") return "מנהל מערכת"; // Admin
    return r; // Fallback
  }; // End roleLabel

  const statusLabel = (s) => { // Convert status to Hebrew label
    if (s === "active") return "פעיל"; // Active
    if (s === "inactive") return "לא פעיל"; // Inactive
    return s; // Fallback
  }; // End statusLabel

  return ( // Render page
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10"> {/* Background */}
      <div className="mx-auto w-full max-w-5xl"> {/* Center container */}
        <div className="mb-6"> {/* Header */}
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ניהול משתמשים</h1> {/* Title */}
          <p className="text-sm text-slate-300 mt-1">סינון, צפייה ועדכון משתמשים</p> {/* Subtitle */}
        </div> {/* End header */}

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          {error ? ( // If error exists
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"> {/* Error box */}
              {error} {/* Error text */}
            </div> // End error box
          ) : null} {/* End conditional */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"> {/* Filters */}
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
          </div> {/* End filters */}

          <div className="overflow-auto rounded-xl border border-slate-200"> {/* Table wrapper */}
            <table className="min-w-full text-sm"> {/* Table */}
              <thead className="bg-slate-50"> {/* Header */}
                <tr> {/* Row */}
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">שם</th> {/* Name */}
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">שם משתמש</th> {/* Username */}
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">תפקיד</th> {/* Role */}
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">סטטוס</th> {/* Status */}
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">פעולות</th> {/* Actions */}
                </tr> {/* End row */}
              </thead> {/* End thead */}

              <tbody className="divide-y divide-slate-200"> {/* Body */}
                {loading ? ( // If loading
                  <tr> {/* Row */}
                    <td className="px-3 py-4 text-slate-600" colSpan={5}>טוען משתמשים...</td> {/* Loading cell */}
                  </tr> // End row
                ) : filtered.length === 0 ? ( // If no results
                  <tr> {/* Row */}
                    <td className="px-3 py-4 text-slate-600" colSpan={5}>לא נמצאו משתמשים</td> {/* Empty */}
                  </tr> // End row
                ) : (
                  filtered.map((u) => ( // Render rows
                    <tr key={u.id} className="bg-white"> {/* Row */}
                      <td className="px-3 py-3 text-slate-900">{u.name}</td> {/* Name */}
                      <td className="px-3 py-3 text-slate-700">{u.username}</td> {/* Username */}

                      <td className="px-3 py-3"> {/* Role cell */}
                        <select
                          className="px-2 py-1 rounded-lg border border-slate-300 text-sm"
                          value={u.role}
                          disabled={rowBusyId === u.id}
                          onChange={(e) => onChangeRowRole(u.id, e.target.value)}
                        >
                          <option value="student">{roleLabel("student")}</option>
                          <option value="invigilator">{roleLabel("invigilator")}</option>
                          <option value="lecturer">{roleLabel("lecturer")}</option>
                          <option value="admin">{roleLabel("admin")}</option>
                        </select>
                      </td> {/* End role cell */}

                      <td className="px-3 py-3"> {/* Status cell */}
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          {statusLabel(u.status)}
                        </span>
                      </td> {/* End status cell */}

                      <td className="px-3 py-3"> {/* Actions */}
                        <button
                          type="button"
                          disabled={rowBusyId === u.id}
                          onClick={() => onToggleStatus(u.id, u.status)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition"
                        >
                          {u.status === "active" ? "השבת" : "הפעל"}
                        </button>
                      </td> {/* End actions */}
                    </tr> // End row
                  )) // End map
                )}
              </tbody> {/* End tbody */}
            </table> {/* End table */}
          </div> {/* End table wrapper */}
        </div> {/* End card */}
      </div> {/* End container */}
    </div> // End page
  ); // End return
} // End component
