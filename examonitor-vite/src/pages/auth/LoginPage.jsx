// src/pages/auth/LoginPage.jsx

import React, { useMemo, useState } from "react"; // React + hooks
import { useNavigate } from "react-router-dom"; // Router navigation
import RoleSelector from "../../components/auth/RoleSelector";
import FormField from "../../components/shared/FormField";
import { DEFAULT_ROLE, loginWithApi, normalizeRole } from "../../handlers/authHandlers"; // Auth handlers (backend-driven)

export default function LoginPage() { // Login page component
  const navigate = useNavigate(); // Create navigation function

  const [role, setRole] = useState(DEFAULT_ROLE); // Selected role (from handlers)
  const [username, setUsername] = useState(""); // Username input state
  const [password, setPassword] = useState(""); // Password input state
  const [rememberMe, setRememberMe] = useState(false); // Remember checkbox state (UI only for now)

  const [isSubmitting, setIsSubmitting] = useState(false); // Track submit loading state
  const [formError, setFormError] = useState(""); // Track top-level form error
  const [fieldErrors, setFieldErrors] = useState({}); // Track per-field errors

  // Temporary API mock (until you connect a real backend API module). // This simulates deps.authApi.login(...)
  const authApiMock = useMemo(() => { // Memoize mock api so it does not recreate every render
    return { // Return api object
      login: async ({ username: u, role: r }) => { // Mock login endpoint function
        return { token: "mock-token", user: { username: u, role: r } }; // Mock response shape
      }, // End login
    }; // End api object
  }, []); // No dependencies

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
        { username, password, role, rememberMe }, // Payload from UI state
        {} // Use mock for now
      ); // End handler call

      if (!result.ok) { // If validation failed (handler returns errors)
        setFieldErrors(result.errors || {}); // Show field errors in UI
        setIsSubmitting(false); // Stop loading
        return; // Exit early
      } // End error case

      // Success case: handler returned backend data. // You can store token/user later in AuthContext
      const safeRole = normalizeRole(role); // Normalize role for routing

      // Route decision (assumption): no dedicated student page yet, so student goes to exam console. // Adjust later
      if (safeRole === "admin") navigate("/admin/users"); // Admin -> manage users
      else navigate("/exam/active"); // Student / invigilator / lecturer -> active exam (for now)
    } catch (err) { // Handle unexpected errors
      setFormError(err?.message || "Login failed"); // Set a readable message
    } finally { // Always run cleanup
      setIsSubmitting(false); // Stop loading state
    } // End try/catch/finally
  }; // End submit

  return ( // Return UI
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4"> {/* Same background wrapper */}
      <div className="w-full max-w-md"> {/* Same width constraint */}

        <div className="text-center mb-8"> {/* Logo + Title block */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-400/40 mb-3"> {/* Logo container */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"> {/* Lock icon */}
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect> {/* Lock body */}
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path> {/* Lock shackle */}
            </svg> {/* End icon */}
          </div> {/* End logo container */}

          <h1 className="text-2xl font-extrabold text-white tracking-tight">ExamMonitor</h1> {/* Title */}
          <p className="text-sm text-slate-300 mt-1">מערכת ניהול נוכחות ובקרה בזמן אמת לבחינות</p> {/* Subtitle */}
        </div> {/* End logo/title */}

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">כניסה למערכת</h2> {/* Card title */}

          {/* Top-level error (API/network/unexpected) */}
          {formError ? ( // Render if error exists
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"> {/* Error box */}
              {formError} {/* Error text */}
            </div> // End error box
          ) : null} {/* End conditional */}

          <div className="mb-4"> {/* Role selection */}
            <label className="block text-xs font-medium text-slate-600 mb-2">בחר תפקיד</label> {/* Label */}

            <RoleSelector value={role} onChange={setRole} disabled={isSubmitting} />

            <p className="text-[11px] text-slate-500 mt-1">ההרשאות והמסכים במערכת יותאמו לפי תפקידך.</p> {/* Helper text */}
          </div> {/* End role selection */}

          <form className="space-y-4 mt-4" onSubmit={onSubmit}> {/* Form */}
            <div> {/* Username field */}
             <FormField
                  id="username"
                  name="username"
                  type="text"
                  label="שם משתמש"
                  placeholder="הכנס שם משתמש מוסדי"
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
                  placeholder="הכנס סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
            </div> {/* End password */}
            <div className="flex items-center justify-between text-xs"> {/* Remember + Forgot row */}
              <label className="inline-flex items-center gap-2 text-slate-600"> {/* Checkbox label */}
                <input
                  type="checkbox" // Checkbox
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" // Styling
                  checked={rememberMe} // Controlled checked
                  onChange={(e) => setRememberMe(e.target.checked)} // Update state
                /> {/* End checkbox */}
                <span>זכור אותי במחשב זה</span> {/* Text */}
              </label> {/* End label */}

              <button type="button" className="text-blue-600 hover:text-blue-700 hover:underline">שכחתי סיסמה</button> {/* Forgot button */}
            </div> {/* End remember/forgot */}

            <button
              type="submit" // Submit
              disabled={isSubmitting} // Disable while submitting
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-500/30 transition" // Styling
            >
              <span>{isSubmitting ? "מתחבר..." : "כניסה למערכת"}</span> {/* Button text */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> {/* Arrow icon */}
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.586L11.293 6.707A1 1 0 1112.707 5.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" /> {/* Path */}
              </svg> {/* End icon */}
            </button> {/* End submit */}

            <button
              type="button" // Secondary action
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/30 transition" // Styling
            >
              <span>הרשמה</span> {/* Text */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> {/* Plus icon */}
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z" clipRule="evenodd" /> {/* Path */}
              </svg> {/* End icon */}
            </button> {/* End register button */}
          </form> {/* End form */}

          <p className="mt-4 text-[11px] text-center text-slate-400">גישה מאובטחת. ניסיונות כניסה נרשמים ומנוטרים.</p> {/* Footer text */}
        </div> {/* End card */}

        <p className="mt-4 text-center text-[11px] text-slate-400">בחינה מקוונת? ניהול נוכחות? ExamMonitor שומרת עליכם.</p> {/* Under card text */}
      </div> {/* End wrapper */}
    </div> // End background container
  ); // End return
} // End component
