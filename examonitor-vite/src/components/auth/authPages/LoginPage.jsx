// src/pages/auth/LoginPage.jsx

import React, { useMemo, useState } from "react"; // React + hooks
import { useNavigate } from "react-router-dom"; // Router navigation
import RoleSelector from "../authComponents/RoleSelector"; // Role selection component
import FormField from "../../shared/FormField"; // Input component
import { useAuth } from "../../../components/state/AuthContext"; // Auth context
import { useTheme } from "../../../components/state/ThemeContext"; // הוספת Theme Context
import { DEFAULT_ROLE, loginWithApi, normalizeRole } from "../../../handlers/authHandlers"; // Auth handlers (backend-driven)

export default function LoginPage() { // Login page component
  const navigate = useNavigate(); // Create navigation function
  const auth = useAuth(); // Auth context hook
  const { isDark, toggleTheme } = useTheme(); // שימוש בערכת הנושא

  const [role, setRole] = useState(DEFAULT_ROLE); // Selected role (from handlers)
  const [username, setUsername] = useState(""); // Username input state
  const [password, setPassword] = useState(""); // Password input state

  const [isSubmitting, setIsSubmitting] = useState(false); // Track submit loading state
  const [formError, setFormError] = useState(""); // Track top-level form error
  const [fieldErrors, setFieldErrors] = useState({}); // Track per-field errors

  const roleButtonBaseClass = useMemo(() => { // Memoize shared role button classes
    return "role-btn px-3 py-2 rounded-xl border text-xs font-medium transition"; // Same size/shape as HTML
  }, []); // No dependencies

  const getRoleButtonClass = (btnRole) => { // Compute role button class per role
    const normalizedBtnRole = normalizeRole(btnRole); // Normalize button role value
    if (normalizedBtnRole === role) { // If this is the selected role
      return `${roleButtonBaseClass} border-blue-500 bg-blue-50 text-blue-700 shadow-sm`; // Selected style
    } // End selected role check
    return `${roleButtonBaseClass} border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50`; // Unselected style
  }; // End helper

  const onSubmit = async (e) => { // Handle submit
    e.preventDefault(); // Prevent page reload

    setFormError(""); // Clear previous top-level error
    setFieldErrors({}); // Clear previous field errors

    setIsSubmitting(true); // Set loading state
    try { // Start try/catch for async call
      const result = await loginWithApi( // Call handler (which calls the API)
        { username, password, role,  }, // Payload from UI state
        { navigate, auth } // Dependencies
      ); // End handler call

      if (!result.ok) { // If validation failed (handler returns errors)
        setFieldErrors(result.errors || {}); // Show field errors in UI
        if (result.apiError?.message) setFormError(result.apiError.message); // API error
        setIsSubmitting(false); // Stop loading
        return; // Exit early
      } // End error case

      // Success case: handler returned backend data.
      auth.login(result.data.user, result.data.token); // Update auth context
      const safeRole = normalizeRole(role); // Normalize role for routing

      // Route decision
      if (safeRole === "admin") navigate("/admin/users"); // Admin -> manage users
      else if(safeRole === "supervisor") navigate("/select-exam"); 
      else if(safeRole === "lecturer") navigate("/select-exam");
      else if(safeRole === "student") navigate("/student/page");
      else if(safeRole === "floor_supervisor") navigate("/supervisor/floorsupervisorDashboardPage");
    } catch (err) { // Handle unexpected errors
      setFormError(err?.message || "Login failed"); // Set a readable message
    } finally { // Always run cleanup
      setIsSubmitting(false); // Stop loading state
    } // End try/catch/finally
  }; // End submit

  return ( // Return UI
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

      <div className="w-full max-w-md"> {/* Same width constraint */}

        <div className="text-center mb-8"> {/* Logo + Title block */}
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-3 transition-colors ${
            isDark ? "bg-blue-500/10 border-blue-400/40" : "bg-blue-600/10 border-blue-600/20"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${isDark ? "text-blue-400" : "text-blue-600"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"> 
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h1 className={`text-2xl font-extrabold tracking-tight transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
            ExamMonitor
          </h1>
          <p className={`text-sm mt-1 transition-colors ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            מערכת ניהול נוכחות ובקרה בזמן אמת לבחינות
          </p>
        </div>

        <div className={`backdrop-blur-md shadow-2xl rounded-2xl p-6 border transition-all duration-300 ${
          isDark ? "bg-slate-900/90 border-white/10" : "bg-white/95 border-slate-200"
        }`}> 
          <h2 className={`text-lg font-semibold mb-4 text-center ${isDark ? "text-white" : "text-slate-900"}`}>
            כניסה למערכת
          </h2>

          {formError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="mb-4">
            <RoleSelector value={role} onChange={setRole} disabled={isSubmitting} isDark={isDark} />
          </div>

         <form className="space-y-4 mt-4" onSubmit={onSubmit}>
            <div className="space-y-1"> {/* צמצום מרווחים פנימיים */}
              <FormField
                id="username"
                label="שם משתמש"
                placeholder="הכנס שם משתמש מוסדי"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={fieldErrors.username}
                isDark={isDark}
                autoComplete="username"
              />

              <FormField
                id="password"
                type="password"
                label="סיסמה"
                placeholder="הכנס סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                isDark={isDark}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              {isSubmitting ? "מתחבר..." : "כניסה למערכת"}
            </button>

            
          </form>

          <p className={`mt-4 text-[11px] text-center transition-colors ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            גישה מאובטחת. ניסיונות כניסה נרשמים ומנוטרים.
          </p>
        </div>

        <p className={`mt-4 text-center text-[11px] transition-colors ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          בחינה מקוונת? ניהול נוכחות? ExamMonitor שומרת עליכם.
        </p>
      </div>
    </div>
  );
}