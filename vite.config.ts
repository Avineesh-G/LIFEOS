import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'lucide-react',
      'date-fns',
      '@material/material-color-utilities',
      '@rive-app/react-canvas-lite',
      'recharts',
    ],
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@material/material-color-utilities')) {
              return 'vendor-material';
            }
          }
        },
      },
    },
  },
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/components/Layout.tsx',
        './src/pages/Home.tsx',
      ],
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
    },
  },
});

