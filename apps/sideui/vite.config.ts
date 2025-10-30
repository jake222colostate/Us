import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // Map workspace packages directly to source so Vite can resolve them.
      "@us/auth": path.resolve(__dirname, "../../packages/auth/src/index.ts"),
      "@us/api-client": path.resolve(__dirname, "../../packages/api-client/src/index.ts"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: false,
  },
});
