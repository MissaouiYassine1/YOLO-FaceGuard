import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Pour les imports absolus
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Proxy vers le backend
    },
  },
});