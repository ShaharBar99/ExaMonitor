// src/pages/admin/SecurityAlertsPage.jsx

import React, { useEffect, useMemo, useState } from "react"; // React + hooks
import SelectField from "../../shared/SelectField"; // Reusable select
import { fetchSecurityAlerts, filterSecurityAlerts, resolveAlert } from "../../../handlers/securityAlertsHandlers"; // Security handlers
import AdminTable from "../adminComponents/AdminTable";
import { useNavigate } from "react-router-dom"; // Navigation
export default function SecurityAlertsPage() { // Security alerts page
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]); // Alerts list
  const [loading, setLoading] = useState(false); // Loading flag
  const [error, setError] = useState(""); // Error text

  const [severity, setSeverity] = useState(""); // Severity filter
  const [status, setStatus] = useState(""); // Status filter
  const [rowBusyId, setRowBusyId] = useState(""); // Row busy tracking
 
  useEffect(() => { // Load on mount
    let mounted = true; // Mounted guard
    const run = async () => { // Async fetch
      setLoading(true); // Start loading
      setError(""); // Clear error
      try { // Try fetch
        const res = await fetchSecurityAlerts({}, {}); // Fetch (mock/REST under the hood)
        if (!mounted) return; // Stop if unmounted
        setAlerts(res.data.alerts); // Store alerts
      } catch (e) { // Catch errors
        if (!mounted) return; // Stop if unmounted
        setError(e?.message || "Failed to load security alerts"); // Set error
        navigate("/login"); // Navigate away on error
      } finally { // Always
        if (!mounted) return; // Stop if unmounted
        setLoading(false); // Stop loading
      } // End try/catch/finally
    }; // End run
    run(); // Execute
    return () => { mounted = false; }; // Cleanup
  }, []); // Mount only

  const filtered = useMemo(() => { // Filter memo
    return filterSecurityAlerts(alerts, { severity, status }); // Apply filters
  }, [alerts, severity, status]); // Dependencies

  const severityOptions = useMemo(() => ([
    { value: "", label: "כל החומרות" }, // All
    { value: "low", label: "נמוכה" }, // Low
    { value: "medium", label: "בינונית" }, // Medium
    { value: "high", label: "גבוהה" }, // High
  ]), []); // Options

  const statusOptions = useMemo(() => ([
    { value: "", label: "כל הסטטוסים" }, // All
    { value: "open", label: "פתוח" }, // Open
    { value: "resolved", label: "טופל" }, // Resolved
  ]), []); // Options
  const columns = useMemo(() => ([
  { key: "ts", header: "זמן" },
  { key: "severity", header: "חומרה" },
  { key: "type", header: "סוג" },
  { key: "message", header: "הודעה" },
  { key: "status", header: "סטטוס" },
  { key: "actions", header: "פעולות" },
]), []);


  const onResolve = async (alertId) => { // Resolve click handler
    setRowBusyId(alertId); // Set row busy
    setError(""); // Clear error
    try { // Try resolve
      const res = await resolveAlert(alertId, {}); // Call handler
      const updated = res?.data?.alert; // Extract updated alert
      if (!updated) throw new Error("Resolve failed"); // Guard
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a))); // Update local
    } catch (e) { // Catch errors
      setError(e?.message || "Failed to resolve alert"); // Set error
    } finally { // Always
      setRowBusyId(""); // Clear busy
    } // End try/catch/finally
  }; // End onResolve

  const sevBadge = (sev) => { // Severity badge text
    if (sev === "high") return "גבוהה"; // High
    if (sev === "medium") return "בינונית"; // Medium
    if (sev === "low") return "נמוכה"; // Low
    return sev; // Fallback
  }; // End sevBadge

  const statusBadge = (st) => { // Status badge text
    if (st === "open") return "פתוח"; // Open
    if (st === "resolved") return "טופל"; // Resolved
    return st; // Fallback
  }; // End statusBadge

  return ( // Render
      <div>
        <div className="mb-6"> {/* Header */}
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Security Alerts</h1> {/* Title */}
          <p className="text-sm text-slate-300 mt-1">התראות אבטחה</p> {/* Subtitle */}
        </div> {/* End header */}

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          {error ? ( // Error banner
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"> {/* Filters */}
            <SelectField
              id="severityFilter"
              name="severityFilter"
              label="חומרה"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              options={severityOptions}
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

          <AdminTable
              columns={columns}
              loading={loading}
              emptyText="אין התראות"
              loadingText="טוען..."
            >
              {filtered.length === 0 ? null : (
                filtered.map((a) => (
                  <tr key={a.id} className="bg-white">
                    <td className="px-3 py-3 text-slate-700">{a.ts}</td>
                    <td className="px-3 py-3 text-slate-700">{sevBadge(a.severity)}</td>
                    <td className="px-3 py-3 text-slate-700">{a.type}</td>
                    <td className="px-3 py-3 text-slate-900">{a.message}</td>
                    <td className="px-3 py-3 text-slate-700">{statusBadge(a.status)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={a.status === "resolved" || rowBusyId === a.id}
                        onClick={() => onResolve(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition"
                      >
                        טפל
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </AdminTable>
        </div> {/* End card */}
      </div>
  ); // End return
} // End component
