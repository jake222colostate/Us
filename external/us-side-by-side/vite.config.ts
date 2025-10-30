import { Buffer } from "node:buffer";
import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import type { PluginOption } from "vite";
import { defineConfig, loadEnv } from "vite";

const devClientErrorLogger = (): PluginOption => ({
  name: "dev-client-error-logger",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/__client-log", async (req, res, next) => {
      if (req.method !== "POST") {
        next();
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const raw = Buffer.concat(chunks).toString();
        const payload = raw ? JSON.parse(raw) : {};
        const message = payload?.message ?? "Client error";
        const details = [payload?.url, payload?.source]
          .filter(Boolean)
          .join(" · ");
        const stack = payload?.stack ? `\n${payload.stack}` : "";

        const composed = details ? `${message} (${details})` : message;
        server.config.logger.error(`[client] ${composed}${stack}`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        server.config.logger.error(`[client] Failed to process error payload: ${reason}`);
      }

      res.statusCode = 204;
      res.end();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE;

  return {
    server: {
      host: true,
      port: 8000,
      strictPort: true,
      proxy: apiProxyTarget
        ? {
            "/api": {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "development" && devClientErrorLogger(),
    ].filter(Boolean) as PluginOption[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
