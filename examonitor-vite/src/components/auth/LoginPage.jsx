// client/src/pages/auth/LoginPage.jsx

import React, { useMemo, useState } from "react"; // React + hooks
import { useNavigate } from "react-router-dom"; // Router navigation

export default function LoginPage() { 
  const navigate = useNavigate(); 

  const [role, setRole] = useState("invigilator"); // Selected role (same default as HTML)
  const [username, setUsername] = useState(""); // Username input state
  const [password, setPassword] = useState(""); // Password input state
  const [rememberMe, setRememberMe] = useState(false); // Remember checkbox state

  const roleButtonBaseClass = useMemo(() => { 
    return "role-btn px-3 py-2 rounded-xl border text-xs font-medium transition"; 
  }, []); 

  const getRoleButtonClass = (btnRole) => { // Compute role button class per role
    if (btnRole === role) { // If this is the selected role
      return `${roleButtonBaseClass} border-blue-500 bg-blue-50 text-blue-700 shadow-sm`; // Selected style (matches HTML)
    } // End selected role check
    return `${roleButtonBaseClass} border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50`; // Unselected style (matches HTML)
  }; // End helper

  const onSubmit = (e) => { // Handle submit
    e.preventDefault(); // Prevent page reload
    console.log("Login attempt:", { username, role, rememberMe }); // Preserve current behavior (log)
    navigate("/exam/active"); // Temporary navigation (same idea as your HTML comment)
  }; // End submit

  return ( 
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4" dir="rtl"> 
      <div className="w-full max-w-md"> 

        <div className="text-center mb-8"> 
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-400/40 mb-3 text-blue-400"> 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"> 
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect> 
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path> 
            </svg> 
          </div> 

          <h1 className="text-2xl font-extrabold text-white tracking-tight">ExamMonitor</h1> 
          <p className="text-sm text-slate-300 mt-1">מערכת ניהול נוכחות ובקרה בזמן אמת לבחינות</p> 
        </div> 

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">כניסה למערכת</h2> {/* Card title */}

          <div className="mb-4"> 
            <label className="block text-xs font-medium text-slate-600 mb-2 text-right">בחר תפקיד</label> 

            <div className="grid grid-cols-3 gap-2 text-xs font-medium" id="role-toggle"> {/* 4 role buttons */}
              <button type="button" className={getRoleButtonClass("Student")} onClick={() => setRole("Student")}>סטודנט</button> {/* Student */}
              <button type="button" className={getRoleButtonClass("invigilator")} onClick={() => setRole("invigilator")}>משגיח</button> {/* Invigilator */}
              <button type="button" className={getRoleButtonClass("lecturer")} onClick={() => setRole("lecturer")}>מרצה</button> {/* Lecturer */}
              <button type="button" className={getRoleButtonClass("admin")} onClick={() => setRole("admin")}>מנהל מערכת</button> {/* Admin */}
            </div> {/* End role toggle */}

            <p className="text-[11px] text-slate-500 mt-2 text-right">ההרשאות והמסכים במערכת יותאמו לפי תפקידך.</p> 
          </div> 

          <form className="space-y-4 mt-4" onSubmit={onSubmit}> 
            <div> 
              <label className="block text-xs font-medium text-slate-600 mb-1 text-right" htmlFor="username">שם משתמש</label> 
              <input
                id="username" // Input id
                name="username" // Input name
                type="text" // Type text
                required // Required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 bg-white" // Same styling
                placeholder="הכנס שם משתמש מוסדי" // Same placeholder
                value={username} // Controlled value
                onChange={(e) => setUsername(e.target.value)} // Update state
              /> {/* End input */}
            </div> {/* End username */}

            <div> 
              <label className="block text-xs font-medium text-slate-600 mb-1 text-right" htmlFor="password">סיסמה</label> 
              <input
                id="password" // Input id
                name="password" // Input name
                type="password" // Password type
                required // Required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 bg-white" // Same styling
                placeholder="הכנס סיסמה" // Same placeholder
                value={password} // Controlled value
                onChange={(e) => setPassword(e.target.value)} // Update state
              /> {/* End input */}
            </div> {/* End password */}

            <div className="flex items-center justify-between text-xs"> 
              <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer"> 
                <input
                  type="checkbox" // Checkbox
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" // Same styling
                  checked={rememberMe} // Controlled checked
                  onChange={(e) => setRememberMe(e.target.checked)} // Update state
                /> {/* End checkbox */}
                <span>זכור אותי במחשב זה</span> {/* Text */}
              </label> {/* End label */}

              <button type="button" className="text-blue-600 hover:text-blue-700 hover:underline">שכחתי סיסמה</button> 
            </div> 

            <button
              type="submit" // Submit
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/30 transition" // Same styling
            >
              <span>כניסה למערכת</span> {/* Button text */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> {/* Arrow icon */}
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.586L11.293 6.707A1 1 0 1112.707 5.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" /> {/* Path */}
              </svg> {/* End icon */}
            </button> {/* End submit */}

            <button
              type="button" // Secondary action
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/30 transition" // Same styling
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
