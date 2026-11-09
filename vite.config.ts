import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
// If building for mobile (Capacitor), base must be './' so file:// protocol can resolve assets
// If building for GitHub Pages, base is '/vibekids-english/'
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: process.env.VITE_APP_TARGET === 'mobile' ? './' : '/vibekids-english/',
  build: {
    // Tự động phân tách vendor chunk theo khuyến nghị của Maintenance Architect
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/canvas-confetti')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'vendor-capacitor';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
