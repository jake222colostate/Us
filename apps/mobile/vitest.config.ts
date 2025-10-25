import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@us/ui': path.resolve(__dirname, '../..', 'packages/ui/src'),
      '@us/types': path.resolve(__dirname, '../..', 'packages/types/src'),
      '@us/config': path.resolve(__dirname, '../..', 'packages/config/src'),
    },
  },
});
