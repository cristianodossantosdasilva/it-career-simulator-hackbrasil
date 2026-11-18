import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { aparenciaInicial } from './plugins/aparenciaInicial.ts'

export default defineConfig({
  plugins: [react(), aparenciaInicial()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
