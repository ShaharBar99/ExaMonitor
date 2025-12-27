// src/pages/auth/RegisterPage.jsx

import React, { useState } from "react"; // React + hooks
import { useNavigate } from "react-router-dom"; // Router navigation
import RoleSelector from "../../components/auth/RoleSelector"; // Role selector
import FormField from "../../components/shared/FormField"; // Reusable input
import { DEFAULT_ROLE, registerWithApi } from "../../handlers/authHandlers"; // Auth handler

export default function RegisterPage() { // Register page component
  const navigate = useNavigate(); // Navigation function

  const [role, setRole] = useState(DEFAULT_ROLE); // Selected role
  const [name, setName] = useState(""); // Name state
  const [username, setUsername] = useState(""); // Username state
  const [password, setPassword] = useState(""); // Password state
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading
  const [formError, setFormError] = useState(""); // Top error
  const [fieldErrors, setFieldErrors] = useState({}); // Field errors

  const onSubmit = async (e) => { // Submit handler
    e.preventDefault(); // Prevent refresh
    setFormError(""); // Clear error
    setFieldErrors({}); // Clear field errors
    setIsSubmitting(true); // Start loading

    try { // Try register
      const result = await registerWithApi( // Call handler
        { name, username, password, role }, // Payload
        {} // Uses VITE_USE_AUTH_MOCK by default
      ); // End call

      if (!result.ok) { // Handle validation/mock errors
        if (result.errors) setFieldErrors(result.errors); // Field errors
        if (result.apiError?.message) setFormError(result.apiError.message); // API error
        return; // Stop
      } // End error case

      navigate("/login"); // Go back to login after successful register
    } catch (err) { // Unexpected errors
      setFormError(err?.message || "Register failed"); // Show error
    } finally { // Always
      setIsSubmitting(false); // Stop loading
    } // End try/catch/finally
  }; // End onSubmit

  return ( // UI
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4"> {/* Background */}
      <div className="w-full max-w-md"> {/* Wrapper */}

        <div className="text-center mb-8"> {/* Header */}
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ExamMonitor</h1> {/* Title */}
          <p className="text-sm text-slate-300 mt-1">יצירת משתמש חדש</p> {/* Subtitle */}
        </div> {/* End header */}

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">הרשמה</h2> {/* Title */}

          {formError ? ( // Top-level error
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          ) : null}

          <RoleSelector value={role} onChange={setRole} disabled={isSubmitting} /> {/* Reuse role selector */}

          <form className="space-y-4 mt-4" onSubmit={onSubmit}> {/* Form */}
            <FormField
              id="name"
              name="name"
              type="text"
              label="שם מלא"
              placeholder="הכנס שם מלא"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              disabled={isSubmitting}
              autoComplete="name"
            />

            <FormField
              id="username"
              name="username"
              type="text"
              label="שם משתמש"
              placeholder="בחר שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={fieldErrors.username}
              disabled={isSubmitting}
              autoComplete="username"
            />

            <FormField
              id="password"
              name="password"
              type="password"
              label="סיסמה"
              placeholder="בחר סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              disabled={isSubmitting}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold shadow-md shadow-emerald-500/30 transition"
            >
              {isSubmitting ? "נרשם..." : "הרשמה"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold transition"
            >
              חזרה לכניסה
            </button>
          </form>
        </div>
      </div>
    </div>
  ); // End return
} // End component
