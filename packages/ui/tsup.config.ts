import { defineConfig } from 'tsup'
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm','cjs'],
  dts: { entry: "src/index.d.ts" },              // <— TEMP: skip .d.ts generation that is failing
  treeshake: false,
  splitting: false,
  external: ['react','react-dom','react-native']
})
