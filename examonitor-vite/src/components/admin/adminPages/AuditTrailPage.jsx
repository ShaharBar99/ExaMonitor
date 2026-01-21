// src/pages/admin/AuditTrailPage.jsx

import React, { useEffect, useMemo, useState } from "react"; 
import FormField from "../../shared/FormField"; 
import { fetchAuditEvents, filterAuditEvents } from "../../../handlers/auditTrailHandlers"; 
import AdminTable from "../adminComponents/AdminTable";
import { useTheme } from "../../state/ThemeContext"; // ייבוא ה-Theme
import { useNavigate } from "react-router-dom"; 

export default function AuditTrailPage() { 
  const navigate = useNavigate();
  const { isDark } = useTheme(); // שימוש בערכת הנושא
  
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(""); 
  const [search, setSearch] = useState(""); 

  useEffect(() => { 
    let mounted = true; 
    const run = async () => { 
      setLoading(true); 
      setError(""); 
      try { 
        const res = await fetchAuditEvents({}, {}); 
        if (!mounted) return; 
        setEvents(res.data.events); 
      } catch (e) { 
        if (!mounted) return; 
        setError(e?.message || "Failed to load audit events"); 
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
    return filterAuditEvents(events, { search }); 
  }, [events, search]); 

  const columns = useMemo(() => ([
    { key: "ts", header: "זמן" },
    { key: "action", header: "פעולה" },
    { key: "note", header: "הערה" },
  ]), []);

  return ( 
    <div className="animate-in fade-in duration-500">
        <div className="mb-6 px-1"> {/* Header */}
          <h1 className={`text-2xl font-black tracking-tight transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}>
            Audit Trail
          </h1>
          <p className={`text-sm mt-1 font-medium transition-colors ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}>
            יומן פעולות מערכת ובקרה
          </p> 
        </div>

        {/* Card Wrapper */}
        <div className={`backdrop-blur-md shadow-2xl rounded-3xl p-6 border transition-all duration-300 ${
          isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200"
        }`}> 
          
          {error ? ( 
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">
              {error}
            </div>
          ) : null}

          <div className="mb-6 max-w-md"> {/* Search box narrowed for better UI */}
            <FormField
              id="auditSearch"
              name="auditSearch"
              type="text"
              label="חיפוש מהיר"
              placeholder="חפש לפי פעולה / זמן / הערה"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
              autoComplete="off"
              isDark={isDark} // העברת ה-Theme לשדה הקלט
            />
          </div>

          {/* Table Area */}
          <AdminTable
            columns={columns}
            loading={loading}
            emptyText="לא נמצאו אירועים התואמים לחיפוש"
            loadingText="מרענן יומן אירועים..."
            isDark={isDark} // העברת ה-Theme לטבלה
          >
            {filtered.map((e) => (
              <tr 
                key={e.id} 
                className={`transition-colors border-b last:border-0 ${
                  isDark 
                    ? "border-white/5 hover:bg-white/5 text-slate-300" 
                    : "border-slate-100 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <td className="px-4 py-4 font-mono text-[11px] whitespace-nowrap">
                  {e.ts}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700"
                  }`}>
                    {e.action}
                  </span>
                </td>
                <td className={`px-4 py-4 text-xs font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}>
                  {e.note || "-"}
                </td>
              </tr>
            ))}
          </AdminTable>
        </div> 
        
        <div className={`mt-4 px-2 text-[10px] font-bold uppercase tracking-widest ${
          isDark ? "text-slate-600" : "text-slate-400"
        }`}>
          נמצאו {filtered.length} רשומות
        </div>
      </div>
  ); 
}