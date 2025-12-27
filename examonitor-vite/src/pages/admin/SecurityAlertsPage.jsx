// src/pages/admin/SecurityAlertsPage.jsx

import React from "react"; // Import React

export default function SecurityAlertsPage() { // Security alerts page
  return ( // Render page
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10"> {/* Background */}
      <div className="mx-auto w-full max-w-5xl"> {/* Container */}
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-slate-200"> {/* Card */}
          <h1 className="text-xl font-extrabold text-slate-900">Security Alerts</h1> {/* Title */}
          <p className="text-sm text-slate-600 mt-1">Placeholder (handlers/API later)</p> {/* Subtitle */}
        </div> {/* End card */}
      </div> {/* End container */}
    </div> // End page
  ); // End return
} // End component
