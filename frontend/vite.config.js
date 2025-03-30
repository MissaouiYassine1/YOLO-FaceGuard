import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Nécessaire pour le chargement des assets HTML
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    assetsInclude: ['**/*.html'], // Inclure les fichiers HTML dans le build
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        contact: path.resolve(__dirname, 'src/pages/Contact/contact.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});