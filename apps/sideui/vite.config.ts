import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  server: { host: true, port: 5173 },
  plugins: [react()],
  resolve: {
    alias: {
      "@us/auth": require("node:path").resolve(__dirname, "../../packages/auth/src"),
      "@us/api-client": require("node:path").resolve(__dirname, "../../packages/api-client/src"),
    },
    alias: {
      '@us/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@us/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
    },
  },
})
