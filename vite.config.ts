import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'watertight-unpiratically-milagros.ngrok-free.dev',
      '.ngrok-free.dev',
    ],
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    // Proxy API requests to local backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
