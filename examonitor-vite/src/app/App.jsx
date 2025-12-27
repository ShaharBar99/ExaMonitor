import React from "react"; // React import
import { BrowserRouter } from "react-router-dom"; // Router provider for browser navigation
import AppRoutes from "./routes"; // Your routes component
import { ExamProvider } from "../state/ExamContext"; // Context provider for exam state

export default function App() { // Main app component
  return ( // Return app UI
    <ExamProvider>
      <BrowserRouter> {/* Enables routing via URL */}
        <AppRoutes /> {/* Renders the route table */}
      </BrowserRouter> {/* End router*/}
    </ExamProvider>
  ); // End return
} // End component
