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
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    assetsInclude: ['**/*.html'],
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        contact: path.resolve(__dirname, 'src/pages/Contact/contact.html'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          $primary-blue: #4ac7ef;
          $secondary-brown: #987551;
          $light-bg: #f3fbfd;
          $dark-bg: #030810;
        `,
      },
    },
  },
});