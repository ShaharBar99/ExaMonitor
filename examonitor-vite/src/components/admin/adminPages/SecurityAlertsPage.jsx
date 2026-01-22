import React, { useEffect, useMemo, useState } from "react"; 
import SelectField from "../../shared/SelectField"; 
import { fetchSecurityAlerts, filterSecurityAlerts, resolveAlert } from "../../../handlers/securityAlertsHandlers"; 
import AdminTable from "../adminComponents/AdminTable";
import { useTheme } from "../../state/ThemeContext"; 
import { useNavigate } from "react-router-dom"; 

export default function SecurityAlertsPage() { 
  const navigate = useNavigate();
  const { isDark } = useTheme(); 
  
  const [alerts, setAlerts] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(""); 

  const [severity, setSeverity] = useState(""); 
  const [status, setStatus] = useState(""); 
  const [rowBusyId, setRowBusyId] = useState(""); 

  useEffect(() => { 
    let mounted = true; 
    const run = async () => { 
      setLoading(true); 
      setError(""); 
      try { 
        const res = await fetchSecurityAlerts({}, {}); 
        if (!mounted) return; 
        setAlerts(res.data.alerts || []); 
      } catch (e) { 
        if (!mounted) return; 
        setError(e?.message || "Failed to load security alerts"); 
        navigate("/login"); 
      } finally { 
        if (!mounted) return; 
        setLoading(false); 
      } 
    }; 
    run(); 
    return () => { mounted = false; }; 
  }, [navigate]); 

  const filtered = useMemo(() => { 
    return filterSecurityAlerts(alerts, { status, severity }); 
  }, [alerts, status, severity]); 

  const columns = useMemo(() => ([
    { key: "ts", header: "זמן" }, 
    { key: "username", header: "משתמש" }, 
    { key: "ip", header: "IP Address" }, 
    { key: "reason", header: "סיבת התראה" }, 
    { key: "status", header: "מצב" }, 
    { key: "actions", header: "פעולות" }, 
  ]), []);

  const onResolve = async (alertId) => { 
    setRowBusyId(alertId); 
    try { 
      const res = await resolveAlert(alertId, {}); 
      const updated = res?.data?.alert; 
      if (updated) setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a))); 
    } catch (e) { 
      setError("סגירת ההתראה נכשלה"); 
    } finally { 
      setRowBusyId(""); 
    } 
  }; 

  return ( 
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 p-4 md:p-0">
        <div className="mb-6 px-1">
          <h1 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Security Alerts
          </h1>
          <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            ניטור וניהול אירועי אבטחה בזמן אמת
          </p> 
        </div>

        <div className={`backdrop-blur-md shadow-2xl rounded-[30px] md:rounded-3xl p-4 md:p-8 border transition-all duration-300 ${
          isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200"
        }`}> 
          
          {error && ( 
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-bold">
              {error}
            </div>
          )}

          {/* Filter Grid: Stacks on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
            <SelectField
              id="severityFilter"
              label="חומרה"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              options={[
                { value: "", label: "כל החומרות" }, 
                { value: "low", label: "נמוכה" }, 
                { value: "medium", label: "בינונית" }, 
                { value: "high", label: "גבוהה" }, 
              ]}
              isDark={isDark}
            />
            <SelectField
              id="statusFilter"
              label="סטטוס"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "", label: "כל הסטטוסים" }, 
                { value: "open", label: "פתוח" }, 
                { value: "resolved", label: "טופל" }, 
              ]}
              isDark={isDark}
            />
          </div>

          <AdminTable columns={columns} loading={loading} isDark={isDark} emptyText="מערכת נקייה - אין התראות אבטחה">
              {filtered.map((a) => (
                <tr key={a.id} className={`flex flex-col md:table-row transition-colors border-b last:border-0 p-4 md:p-0 ${
                  isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"
                }`}>
                  
                  {/* Timestamp */}
                  <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                    <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">זמן</span>
                    <div className={`text-[11px] font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {a.ts}
                    </div>
                  </td>

                  {/* Username */}
                  <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                    <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">משתמש</span>
                    <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {a.username}
                      <span className={`block text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {a.role || "Guest"}
                      </span>
                    </div>
                  </td>

                  {/* IP Address */}
                  <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                    <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">IP Address</span>
                    <div className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {a.ip || "-"}
                    </div>
                  </td>

                  {/* Reason */}
                  <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                    <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">סיבת התראה</span>
                    <div className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {a.reason}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-0 md:px-4 py-2 md:py-4 block md:table-cell">
                    <span className="md:hidden block text-[9px] font-black uppercase text-slate-400 mb-1">מצב</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      a.status === "open" 
                        ? (isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-700")
                        : (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700")
                    }`}>
                      {a.status === "open" ? "פתוח" : "טופל"}
                    </span>
                  </td>

                  {/* Action Button: Full width on mobile */}
                  <td className="px-0 md:px-4 py-4 block md:table-cell">
                    <button
                      type="button"
                      disabled={a.status === "resolved" || rowBusyId === a.id}
                      onClick={() => onResolve(a.id)}
                      className={`w-full md:w-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        a.status === "resolved"
                          ? "opacity-30 cursor-not-allowed bg-slate-700 text-slate-400"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                      }`}
                    >
                      {rowBusyId === a.id ? "מעבד..." : "סגור אירוע"}
                    </button>
                  </td>
                </tr>
              ))}
          </AdminTable>
        </div>
      </div>
  ); 
}