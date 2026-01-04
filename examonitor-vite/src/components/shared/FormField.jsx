// src/components/shared/FormField.jsx

import React from "react"; // React import

export default function FormField({ // Reusable input + label + error
  id, // Input id
  name, // Input name
  type = "text", // Input type
  label, // Label text
  placeholder, // Placeholder text
  value, // Controlled value
  onChange, // Change handler
  error, // Error string (optional)
  disabled = false, // Disabled state
  autoComplete, // Autocomplete attribute (optional)
}) {
  return ( // Return field UI
    <div> {/* Field wrapper */}
      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={id}> {/* Label */}
        {label} {/* Label text */}
      </label> {/* End label */}

      <input
        id={id} // Set id
        name={name || id} // Set name
        type={type} // Set type
        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 bg-white disabled:opacity-60" // Shared styling
        placeholder={placeholder} // Placeholder
        value={value} // Controlled value
        onChange={onChange} // Change handler
        aria-invalid={Boolean(error)} // Accessibility
        disabled={disabled} // Disabled state
        autoComplete={autoComplete} // Autocomplete
      /> {/* End input */}

      {error ? ( // If error exists
        <p className="mt-1 text-[11px] text-red-600">{error}</p> // Render error text
      ) : null} {/* End conditional */}
    </div> // End wrapper
  ); // End return
} // End component
