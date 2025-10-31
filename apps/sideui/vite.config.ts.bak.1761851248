import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react-dom/client": "preact/compat",
    },
  },
  esbuild: {
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
    // inject Preact's h/Fragment automatically for any JSX we keep
    jsxInject: `import { h, Fragment } from 'preact'`,
  },
  server: { host: true, port: 8000, strictPort: true },
  preview: { host: true, port: 8000, strictPort: true },
});
