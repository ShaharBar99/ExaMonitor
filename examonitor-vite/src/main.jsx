/**
 * @fileoverview Application entry point. Mounts the React app to the DOM.
 */
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./styles/globals.css"
import { SocketProvider } from "./components/state/SocketContext.jsx"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>
)
