// src/layouts/AdminLayout.jsx

import React from "react"; // Import React
import { Outlet } from "react-router-dom"; // Import Outlet for nested routes
import AdminNavbar from "./AdminNavbar"; // Import navbar component

export default function AdminLayout() { // Export AdminLayout component
  return ( // Return layout UI
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10"> {/* Background */}
      <div className="mx-auto w-full max-w-5xl"> {/* Center container */}
        <div className="mb-6 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-slate-200"> {/* Navbar card */}
          <AdminNavbar /> {/* Navbar */}
        </div> {/* End navbar card */}

        <Outlet /> {/* Render the active admin page */}
      </div> {/* End container */}
    </div> // End background
  ); // End return
} // End component
