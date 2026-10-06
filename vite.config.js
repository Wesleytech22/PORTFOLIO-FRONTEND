import { defineConfig } from 'vite';

// Em desenvolvimento, /api é repassado ao backend: o navegador fala só com
// o Vite e não há CORS. Em produção, defina VITE_API_URL (ver .env.example).
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:3333',
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
