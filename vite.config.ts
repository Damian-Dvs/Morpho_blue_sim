import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/morpho': {
        target: 'https://blue-api.morpho.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/morpho/, ''),
      },
    },
  },
});
