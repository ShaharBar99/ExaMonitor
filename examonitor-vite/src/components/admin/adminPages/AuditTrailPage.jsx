// src/pages/admin/AuditTrailPage.jsx

import React, { useEffect, useMemo, useState } from "react"; // React + hooks
import FormField from "../../shared/FormField"; // Reusable text input
import { fetchAuditEvents, filterAuditEvents } from "../../../handlers/auditTrailHandlers"; // Audit handlers
import AdminTable from "../adminComponents/AdminTable";

export default function AuditTrailPage() { // Audit trail page
  const [events, setEvents] = useState([]); // Events list
  const [loading, setLoading] = useState(false); // Loading flag
  const [error, setError] = useState(""); // Error text
  const [search, setSearch] = useState(""); // Search input

  useEffect(() => { // Load on mount
    let mounted = true; // Mounted guard
    const run = async () => { // Async fetch
      setLoading(true); // Start loading
      setError(""); // Clear error
      try { // Try fetch
        const res = await fetchAuditEvents({}, {}); // Fetch (mock/REST under the hood)
        if (!mounted) return; // Stop if unmounted
        setEvents(res.data.events); // Store events
      } catch (e) { // Catch errors
        if (!mounted) return; // Stop if unmounted
        setError(e?.message || "Failed to load audit events"); // Set error
      } finally { // Always
        if (!mounted) return; // Stop if unmounted
        setLoading(false); // Stop loading
      } // End try/catch/finally
    }; // End run
    run(); // Execute
    return () => { mounted = false; }; // Cleanup
  }, []); // Mount only

  const filtered = useMemo(() => { // Filter memo
    return filterAuditEvents(events, { search }); // Apply search
  }, [events, search]); // Dependencies
  const columns = useMemo(() => ([
    { key: "ts", header: "זמן" },
    { key: "actor", header: "מבצע" },
    { key: "action", header: "פעולה" },
    { key: "target", header: "יעד" },
    { key: "meta", header: "פרטים" },
  ]), []);

  return ( // Render
    <div>
        <div className="mb-6"> {/* Header */}
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Audit Trail</h1> {/* Title */}
          <p className="text-sm text-slate-300 mt-1">יומן פעולות מערכת</p> {/* Subtitle */}
        </div> {/* End header */}

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          {error ? ( // Error banner
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          ) : null}

          <div className="mb-6"> {/* Search row */}
            <FormField
              id="auditSearch"
              name="auditSearch"
              type="text"
              label="חיפוש"
              placeholder="חפש לפי משתמש / פעולה / יעד"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              error=""
              disabled={loading}
              autoComplete="off"
            />
          </div> {/* End search row */}

          <div className="overflow-auto rounded-xl border border-slate-200"> {/* Table wrapper */}
            <AdminTable
                columns={columns}
                loading={loading}
                emptyText="אין אירועים"
                loadingText="טוען..."
              >
                {filtered.length === 0 ? null : (
                  filtered.map((e) => (
                    <tr key={e.id} className="bg-white">
                      <td className="px-3 py-3 text-slate-700">{e.ts}</td>
                      <td className="px-3 py-3 text-slate-900">{e.actor}</td>
                      <td className="px-3 py-3 text-slate-700">{e.action}</td>
                      <td className="px-3 py-3 text-slate-700">{e.target}</td>
                      <td className="px-3 py-3 text-slate-600">{JSON.stringify(e.meta)}</td>
                    </tr>
                  ))
                )}
              </AdminTable>
          </div> {/* End table wrapper */}
        </div> {/* End card */}
      </div>
  ); // End return
} // End component
