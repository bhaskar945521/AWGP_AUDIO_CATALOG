import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Use VITE_API_BASE_URL if set, otherwise fallback to localhost backend
  const backendTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        // Proxy all /api requests to backend
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy all /uploads requests to backend
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
