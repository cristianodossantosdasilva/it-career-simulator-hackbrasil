import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
    // Os testes mais lentos (propriedade com 25 renders em DemonstracaoCheckIn e axe em EstudoViews) levam
    // 1 a 3 s com a maquina livre e passam de 5 s quando todos os workers disputam a CPU. 15 s da folga
    // sem esconder travamentos reais e dispensa limitar --maxWorkers.
    testTimeout: 15_000,
  },
})
