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
}) {
  return ( // Return UI
    <div> {/* Field wrapper */}
      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={id}> {/* Label */}
        {label} {/* Label text */}
      </label> {/* End label */}

      <select
        id={id} // Set id
        name={name || id} // Set name
        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-60" // Shared styling
        value={value} // Controlled value
        onChange={onChange} // Change handler
        aria-invalid={Boolean(error)} // Accessibility
        disabled={disabled} // Disabled state
      >
        {(options || []).map((opt) => ( // Render options
          <option key={opt.value} value={opt.value}> {/* Option */}
            {opt.label} {/* Option label */}
          </option> // End option
        ))} {/* End map */}
      </select> {/* End select */}

      {error ? ( // If error exists
        <p className="mt-1 text-[11px] text-red-600">{error}</p> // Show error
      ) : null} {/* End conditional */}
    </div> // End wrapper
  ); // End return
} // End component
