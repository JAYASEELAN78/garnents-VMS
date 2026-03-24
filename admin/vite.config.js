import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/');
            const name = parts[parts.length - 1].split('/')[0];
            // Group @scoped packages
            if (name.startsWith('@')) {
              const scoped = parts[parts.length - 1].split('/').slice(0, 2).join('__');
              return `vendor/${scoped}`;
            }
            return `vendor/${name}`;
          }
        }
      }
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
