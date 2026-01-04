// src/components/admin/AdminTable.jsx

import React from "react"; // React import

export default function AdminTable({ // Shared admin table wrapper
  columns, // Array of { key, header, className? }
  children, // <tr> rows
  loading, // Loading flag
  emptyText = "אין נתונים", // Empty placeholder text
  loadingText = "טוען...", // Loading placeholder text
}) {
  const colCount = Array.isArray(columns) ? columns.length : 0; // Column count

  return ( // Render wrapper
    <div className="overflow-auto rounded-xl border border-slate-200"> {/* Shared wrapper */}
      <table className="min-w-full text-sm"> {/* Shared table */}
        <thead className="bg-slate-50"> {/* Shared head */}
          <tr> {/* Header row */}
            {(columns || []).map((c) => ( // Render headers
              <th
                key={c.key} // Unique key
                className={`text-right px-3 py-2 font-semibold text-slate-700 ${c.className || ""}`} // Shared header styling
              >
                {c.header} {/* Header text */}
              </th> // End th
            ))} {/* End map */}
          </tr> {/* End row */}
        </thead> {/* End thead */}

        <tbody className="divide-y divide-slate-200"> {/* Shared body */}
          {loading ? ( // Loading state
            <tr>
              <td className="px-3 py-4 text-slate-600" colSpan={colCount || 1}>{loadingText}</td>
            </tr>
          ) : !children ? ( // No children
            <tr>
              <td className="px-3 py-4 text-slate-600" colSpan={colCount || 1}>{emptyText}</td>
            </tr>
          ) : (
            children // Render rows
          )}
        </tbody> {/* End tbody */}
      </table> {/* End table */}
    </div> // End wrapper
  ); // End return
} // End component
