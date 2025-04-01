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
    host: true, // Écoute sur toutes les interfaces
    port: 3000,
    strictPort: true, // Force le port 3000
    open: true, // Ouvre le navigateur automatiquement
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Port du backend FastAPI
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Proxy Error:', err);
          });
        }
      },
    },
  },

  build: {
    outDir: '../dist', // Dossier de build personnalisé
    emptyOutDir: true,
    assetsInlineLimit: 4096, // Taille max pour l'inlining des assets
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['axios', 'react-icons'],
        },
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@assets/styles/_variables.scss";
          $primary-blue: #4ac7ef;
          $secondary-brown: #987551;
          $light-bg: #f3fbfd;
          $dark-bg: #030810;
        `,
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