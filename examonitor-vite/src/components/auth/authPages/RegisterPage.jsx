// src/pages/auth/RegisterPage.jsx

import React, { useState } from "react"; // React + hooks
import { useNavigate } from "react-router-dom"; // Router navigation
import RoleSelector from "../authComponents/RoleSelector"; // Role selector
import FormField from "../../shared/FormField"; // Reusable input
import { useTheme } from "../../../components/state/ThemeContext"; // Theme context
import { DEFAULT_ROLE, registerWithApi } from "../../../handlers/authHandlers"; // Auth handler

export default function RegisterPage() { // Register page component
  const navigate = useNavigate(); // Navigation function
  const { isDark, toggleTheme } = useTheme(); // Theme state
  
  const roles = DEFAULT_ROLE.slice(0, 3);
  const [role, setRole] = useState(roles); // Selected role
  const [name, setName] = useState(""); // Name state
  const [username, setUsername] = useState(""); // Username state
  const [password, setPassword] = useState(""); // Password state
  const [email, setEmail] = useState(""); // Email state
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
        { name, username, email, password, role }, // Payload
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
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
      isDark 
        ? "bg-linear-to-br from-slate-900 via-slate-800 to-slate-900" 
        : "bg-linear-to-br from-slate-100 via-slate-200 to-slate-100"
    }`}>
      
      {/* כפתור Toggle למעלה משמאל */}
      <button 
        onClick={toggleTheme}
        className={`fixed top-6 left-6 p-3 rounded-2xl border transition-all hover:scale-110 shadow-lg ${
          isDark 
            ? "bg-slate-800 border-white/10 text-amber-400" 
            : "bg-white border-slate-200 text-amber-600"
        }`}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md my-8"> {/* Wrapper */}

        <div className="text-center mb-8"> {/* Header */}
          <h1 className={`text-2xl font-extrabold tracking-tight transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}>
            ExamMonitor
          </h1>
          <p className={`text-sm mt-1 transition-colors ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}>
            יצירת משתמש חדש במערכת
          </p>
        </div>

        <div className={`backdrop-blur-md shadow-2xl rounded-2xl p-6 border transition-all duration-300 ${
          isDark ? "bg-slate-900/90 border-white/10" : "bg-white/95 border-slate-200"
        }`}>
          <h2 className={`text-lg font-semibold mb-4 text-center ${
            isDark ? "text-white" : "text-slate-900"
          }`}>
            הרשמה
          </h2>

          {formError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">
              {formError}
            </div>
          ) : null}

          <RoleSelector 
            value={role} 
            onChange={setRole} 
            disabled={isSubmitting} 
            isRegister={true} 
            isDark={isDark} 
          />

          <form className="space-y-4 mt-4" onSubmit={onSubmit}>
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
              isDark={isDark}
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
              isDark={isDark}
            />

            <FormField
              id="email"
              name="email"
              type="email"
              label="אימייל"
              placeholder="הכנס כתובת אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              disabled={isSubmitting}
              autoComplete="email"
              isDark={isDark}
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
              isDark={isDark}
            />

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-black uppercase tracking-widest shadow-md shadow-emerald-500/30 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? "מבצע רישום..." : "צור חשבון חדש"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                  isDark 
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                חזרה למסך כניסה
              </button>
            </div>
          </form>
        </div>
        
        <p className={`mt-6 text-center text-[10px] font-bold uppercase tracking-widest transition-colors ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}>
          החשבון כפוף לתנאי השימוש של ExamMonitor
        </p>
      </div>
    </div>
  );
}