import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.DEV) {
  import("./lib/dev/client-error-reporter").then(({ installClientErrorReporter }) => {
    installClientErrorReporter();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
