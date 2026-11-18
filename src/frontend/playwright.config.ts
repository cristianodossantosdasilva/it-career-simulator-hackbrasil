import { defineConfig, devices } from '@playwright/test'

/**
 * Projetos visuais: percorrem as visões principais em quatro larguras e salvam screenshots em
 * test-results/visual/. Só executam e2e/visual.spec.ts e e2e/contraste.spec.ts (medição, grava JSON em
 * test-results/contraste/). As jornadas de comportamento
 * (e2e/jornadas.spec.ts) continuam no projeto `chromium`.
 */
const SPEC_VISUAL = /(visual|contraste)\.spec\.ts$/

// Na CI, os servidores sobem fora do Playwright (backend em segundo plano e vite preview).
// E2E_SERVIDORES_EXTERNOS=1 manda o Playwright reaproveitar esses servidores em vez de recusar a porta ocupada.
const reaproveitarServidor = !process.env.CI || process.env.E2E_SERVIDORES_EXTERNOS === '1'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: SPEC_VISUAL,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-375',
      testMatch: SPEC_VISUAL,
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 900 } },
    },
    {
      name: 'tablet-768',
      testMatch: SPEC_VISUAL,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 900 } },
    },
    {
      name: 'desktop-1280',
      testMatch: SPEC_VISUAL,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'desktop-1440',
      testMatch: SPEC_VISUAL,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'dotnet run --no-build --project ../backend/src/Simulador.Api --urls http://127.0.0.1:8080',
      url: 'http://127.0.0.1:8080/health/live',
      // Toda a suite usa 127.0.0.1; o limite padrao de 120 req/min por IP gerava HTTP 429 (F5).
      // Vale so para este servidor de teste. Um backend ja ativo na porta 8080 ignora esta variavel.
      env: { RateLimit__PermitLimit: '5000' },
      reuseExistingServer: reaproveitarServidor,
      timeout: 60_000,
    },
    {
      command: `${npm} run dev -- --host 127.0.0.1 --port 5173 --strictPort`,
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: reaproveitarServidor,
      timeout: 60_000,
    },
  ],
})
