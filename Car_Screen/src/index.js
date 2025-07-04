import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { UserProvider } from "./componant/UserContext";// Import UserProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UserProvider> {/* Wrap App inside UserProvider */}
      <App />
    </UserProvider>
  </React.StrictMode>
);

reportWebVitals();
