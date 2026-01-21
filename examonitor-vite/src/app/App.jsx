import React from "react"; // React import
import { BrowserRouter } from "react-router-dom"; // Router provider for browser navigation
import AppRoutes from "./routes"; // Your routes component
import { ExamProvider } from "../components/state/ExamContext"; // Context provider for exam state
import { AuthProvider } from "../components/state/AuthContext"; // Context provider for auth state
import { SocketProvider } from "../components/state/SocketContext";
import { ThemeProvider } from '../components/state/ThemeContext';

export default function App() { // Main app component
  return ( // Return app UI
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ExamProvider>
            <BrowserRouter> {/* Enables routing via URL */}
              <AppRoutes /> {/* Renders the route table */}
            </BrowserRouter> {/* End router*/}
          </ExamProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  ); // End return
} // End component
