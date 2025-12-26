import React from "react"; // React import
import { BrowserRouter } from "react-router-dom"; // Router provider for browser navigation
import AppRoutes from "./routes"; // Your routes component

export default function App() { // Main app component
  return ( // Return app UI
    <BrowserRouter> {/* Enables routing via URL */}
      <AppRoutes /> {/* Renders the route table */}
    </BrowserRouter> // End router
  ); // End return
} // End component
