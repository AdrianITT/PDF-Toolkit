import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.api-ninjas.com; worker-src 'self' blob: https://cdn.jsdelivr.net; frame-src 'self' blob: https:;",
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'pdf-view': ['pdfjs-dist']
        }
      }
    }
  }
})
