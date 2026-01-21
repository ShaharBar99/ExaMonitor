// src/components/shared/SelectField.jsx

import React from "react"; // Import React

export default function SelectField({ // Reusable select + label + error
  id, // Select id
  name, // Select name
  label, // Label text
  value, // Controlled value
  onChange, // Change handler
  options, // Array of { value, label }
  error, // Error string (optional)
  disabled = false, // Disabled flag
  isDark = false, // הוספת תמיכה במצב כהה
}) {
  return ( // Return UI
    <div className="mb-4"> {/* Field wrapper */}
      <label 
        className={`block text-xs font-black uppercase tracking-widest mb-1.5 mr-1 transition-colors ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`} 
        htmlFor={id}
      > {/* Label */}
        {label} {/* Label text */}
      </label> {/* End label */}

      <div className="relative"> {/* Container for custom arrow styling if needed */}
        <select
          id={id} // Set id
          name={name || id} // Set name
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-sm font-bold appearance-none cursor-pointer ${
            isDark 
              ? "bg-slate-800/50 border-white/5 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10" 
              : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
          } disabled:opacity-60`} // Shared styling
          value={value} // Controlled value
          onChange={onChange} // Change handler
          aria-invalid={Boolean(error)} // Accessibility
          disabled={disabled} // Disabled state
        >
          {(options || []).map((opt) => ( // Render options
            <option 
              key={opt.value} 
              value={opt.value}
              className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
            > {/* Option */}
              {opt.label} {/* Option label */}
            </option> // End option
          ))} {/* End map */}
        </select> {/* End select */}

        {/* Custom Arrow Icon (Optional but recommended for consistency) */}
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error ? ( // If error exists
        <p className="mt-1.5 text-[11px] font-bold text-red-500 mr-1">{error}</p> // Show error
      ) : null} {/* End conditional */}
    </div> // End wrapper
  ); // End return
} // End component