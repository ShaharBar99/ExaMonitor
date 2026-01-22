// src/components/admin/AdminTable.jsx
import React from "react";

export default function AdminTable({
  columns,
  children,
  loading,
  emptyText = "אין נתונים",
  loadingText = "טוען...",
  isDark = false,
}) {
  const colCount = Array.isArray(columns) ? columns.length : 0;

  return (
    <div className={`w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
      isDark ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-200 shadow-sm"
    }`}>
      {/* Container behavior:
          - On 'sm': block display (vertical stacking)
          - On 'md' and up: table display (horizontal columns)
      */}
      <table className="w-full text-sm border-collapse block md:table">
        
        {/* Header: Visible only on tablet (md) and desktop (lg) */}
        <thead className={`hidden md:table-header-group transition-colors ${
          isDark ? "bg-slate-800/50" : "bg-slate-50"
        }`}>
          <tr>
            {(columns || []).map((c) => (
              <th
                key={c.key}
                className={`text-right px-4 py-4 font-black uppercase tracking-widest text-[10px] transition-colors ${
                  isDark ? "text-slate-400" : "text-slate-600"
                } ${c.className || ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body: Becomes a block container for cards on mobile */}
        <tbody className={`block md:table-row-group divide-y transition-colors ${
          isDark ? "divide-white/5" : "divide-slate-200"
        }`}>
          {loading ? (
            <tr>
              <td 
                className={`px-4 py-12 text-center font-bold block md:table-cell ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`} 
                colSpan={colCount}
              >
                <div className="flex items-center justify-center gap-3 animate-pulse">
                   {loadingText}
                </div>
              </td>
            </tr>
          ) : !children || (Array.isArray(children) && children.length === 0) ? (
            <tr>
              <td 
                className={`px-4 py-12 text-center font-bold block md:table-cell ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`} 
                colSpan={colCount}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}