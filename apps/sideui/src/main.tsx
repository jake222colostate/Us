import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./auth";
import "./index.css";

if (import.meta.env.DEV) {
  import("./safety/diag").then(({ installGlobalDiag }) => installGlobalDiag());
  import("./safety/force-visible.css");
}

const el = document.getElementById("root");
if (!el) throw new Error('Missing <div id="root"></div> in index.html');

const root = createRoot(el);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
