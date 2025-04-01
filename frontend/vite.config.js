import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },

  server: {
    host: true,
    port: 3000,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendors: ['axios', 'react-icons'],
        },
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        // Configuration minimale - seulement le compilateur Sass
        // Aucune injection automatique de variables/mixins
        additionalData: `` // Laissez vide pour désactiver l'injection
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@ionic/react',
      'ionicons'
    ],
  },
});