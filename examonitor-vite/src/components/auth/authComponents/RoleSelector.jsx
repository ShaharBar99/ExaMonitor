// src/components/auth/RoleSelector.jsx

import React, { useMemo } from "react"; // Import React and useMemo
import { normalizeRole, ROLE_OPTIONS } from "../../../handlers/authHandlers"; // Import role helpers and options

export default function RoleSelector({ value, onChange, disabled }) { // Role selector component
  const selectedRole = normalizeRole(value); // Normalize current selected role

  const baseClass = useMemo(() => { // Memoize base button class
    return "role-btn px-3 py-2 rounded-xl border text-xs font-medium transition"; // Match your Tailwind styling
  }, []); // No dependencies

  const getButtonClass = (btnRole) => { // Compute class for each role button
    const normalizedBtnRole = normalizeRole(btnRole); // Normalize button role
    if (normalizedBtnRole === selectedRole) { // If selected
      return `${baseClass} border-blue-500 bg-blue-50 text-blue-700 shadow-sm`; // Selected styles
    } // End selected
    return `${baseClass} border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50`; // Unselected styles
  }; // End helper

  const handleClick = (role) => { // Handle clicking a role
    if (disabled) return; // Do nothing when disabled
    if (typeof onChange === "function") onChange(normalizeRole(role)); // Call onChange with normalized role
  }; // End handleClick

  return ( // Return UI
    <div className="mb-4"> {/* Role selection wrapper */}
      <label className="block text-xs font-medium text-slate-600 mb-2">בחר תפקיד</label> {/* Label */}
      <div className="grid grid-cols-2 gap-2 text-xs font-medium" id="role-toggle"> {/* Buttons grid */}
        {ROLE_OPTIONS.map((r) => ( // Render each role option
          <button
            key={r.value} // Unique key
            type="button" // Not a submit button
            className={getButtonClass(r.value)} // Styling based on selection
            onClick={() => handleClick(r.value)} // Update role when clicked
            disabled={disabled} // Disable if needed
          >
            {r.label} {/* Hebrew label */}
          </button> // End button
        ))} {/* End map */}
      </div> {/* End grid */}
      <p className="text-[11px] text-slate-500 mt-1">ההרשאות והמסכים במערכת יותאמו לפי תפקידך.</p> {/* Helper text */}
    </div> // End wrapper
  ); // End return
} // End component