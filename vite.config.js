import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',  // COOP 완전 해제
      'Cross-Origin-Embedder-Policy': 'unsafe-none',  // COEP도 완전 해제
      'Access-Control-Allow-Origin': '*',  // 모든 도메인 허용
    },
  },
});