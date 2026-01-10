// src/components/admin/AdminNavbar.jsx

import React from "react"; // Import React
import { NavLink, useNavigate } from "react-router-dom"; // Import NavLink + navigation
import { useAuth } from "../../state/AuthContext"; // Import Auth context
export default function AdminNavbar() { // Export AdminNavbar component
  const navigate = useNavigate(); // Get navigate function
  let { token, user } = useAuth(); // Get auth state
  const linkBase = "px-3 py-2 rounded-xl text-sm font-semibold transition"; // Shared link styling
  const linkActive = "bg-slate-900 text-white shadow-sm"; // Active link styling
  const linkIdle = "bg-slate-100 text-slate-700 hover:bg-slate-200"; // Inactive link styling

  const getLinkClass = ({ isActive }) => { // Build class based on active route
    return `${linkBase} ${isActive ? linkActive : linkIdle}`; // Return final class string
  }; // End getLinkClass

  const onLogout = () => { // Handle logout click
    sessionStorage.removeItem("token"); // Remove session token (if used)
    localStorage.removeItem("token"); // Remove persistent token (if used)
    token = null; // Clear token in context
    user = null; // Clear user in context
    navigate("/login", { replace: true }); // Go to login page
  }; // End onLogout

  return ( // Return navbar UI
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"> {/* Layout */}
      <div className="flex items-center justify-between md:justify-start gap-3"> {/* Left side */}
        <div className="text-slate-900 font-extrabold tracking-tight">Admin</div> {/* Brand */}
        <div className="hidden md:block text-xs text-slate-600">מערכת ניהול</div> {/* Subtext */}
      </div> {/* End left side */}

      <div className="flex flex-wrap items-center gap-2"> {/* Links */}
        <NavLink to="/admin/users" className={getLinkClass}>משתמשים</NavLink> {/* Users */}
        <NavLink to="/admin/audit" className={getLinkClass}>Audit</NavLink> {/* Audit */}
        <NavLink to="/admin/security" className={getLinkClass}>אבטחה</NavLink> {/* Security */}
        <button
          type="button" // Button
          onClick={onLogout} // Logout handler
          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition" // Styling
        >
          התנתק {/* Text */}
        </button> {/* End logout */}
      </div> {/* End links */}
    </div> // End navbar wrapper
  ); // End return
} // End component
