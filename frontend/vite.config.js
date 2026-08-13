import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Dev server proxies API calls to the Express backend (run separately via
// `npm run dev` at the repo root, which starts both). In production the
// built output is served directly by that same Express server, so no
// proxy is needed there.
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/_pagedock/api': 'http://localhost:3000',
      '/_pagedock/health': 'http://localhost:3000',
    },
  },
});
