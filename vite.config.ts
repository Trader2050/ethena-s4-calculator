import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // When building on GitHub Actions, set base to '/<repo>/' for Pages
  base: process.env.GITHUB_ACTIONS
    ? `/${(process.env.GITHUB_REPOSITORY || '').split('/').pop() || ''}/`
    : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
