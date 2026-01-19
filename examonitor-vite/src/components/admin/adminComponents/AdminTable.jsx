// src/components/admin/AdminTable.jsx

import React from "react"; // React import

export default function AdminTable({ // Shared admin table wrapper
  columns, // Array of { key, header, className? }
  children, // <tr> rows
  loading, // Loading flag
  emptyText = "אין נתונים", // Empty placeholder text
  loadingText = "טוען...", // Loading placeholder text
  isDark = false, // הוספת תמיכה ב-Theme
}) {
  const colCount = Array.isArray(columns) ? columns.length : 0; // Column count

  return ( // Render wrapper
    <div className={`overflow-auto rounded-2xl border transition-all duration-300 ${
      isDark ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-200"
    }`}> {/* Shared wrapper */}
      <table className="min-w-full text-sm border-collapse"> {/* Shared table */}
        <thead className={`transition-colors ${
          isDark ? "bg-slate-800/50" : "bg-slate-50"
        }`}> {/* Shared head */}
          <tr> {/* Header row */}
            {(columns || []).map((c) => ( // Render headers
              <th
                key={c.key} // Unique key
                className={`text-right px-4 py-3 font-black uppercase tracking-widest text-[10px] transition-colors ${
                  isDark ? "text-slate-400" : "text-slate-600"
                } ${c.className || ""}`} // Shared header styling
              >
                {c.header} {/* Header text */}
              </th> // End th
            ))} {/* End map */}
          </tr> {/* End row */}
        </thead> {/* End thead */}

        <tbody className={`divide-y transition-colors ${
          isDark ? "divide-white/5" : "divide-slate-200"
        }`}> {/* Shared body */}
          {loading ? ( // Loading state
            <tr>
              <td className={`px-4 py-8 text-center font-medium animate-pulse ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`} colSpan={colCount || 1}>
                {loadingText}
              </td>
            </tr>
          ) : !children || (Array.isArray(children) && children.length === 0) ? ( // No children
            <tr>
              <td className={`px-4 py-8 text-center font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`} colSpan={colCount || 1}>
                {emptyText}
              </td>
            </tr>
          ) : (
            children // Render rows
          )}
        </tbody> {/* End tbody */}
      </table> {/* End table */}
    </div> // End wrapper
  ); // End return
} // End component