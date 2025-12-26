// client/src/index.js
import React from "react"; // React import
import ReactDOM from "react-dom/client"; // ReactDOM root API
import "./index.css"; // CRA default styles
import "./styles/globals.css"; // Import your custom scrollbar css
import App from "./app/App.jsx"; // Import your App component

const root = ReactDOM.createRoot(document.getElementById("root")); // Create root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); // Render the app
