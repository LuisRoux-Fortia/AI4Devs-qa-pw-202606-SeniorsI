import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para las pruebas E2E de la interfaz `position`.
 *
 * Las pruebas son deterministas: interceptan las llamadas al backend
 * (http://localhost:3010) con `page.route`, por lo que NO es necesario tener
 * el backend ni la base de datos levantados. Playwright solo arranca el
 * frontend (Create React App) definido en `webServer`.
 *
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Un fallo por drag&drop no debería tumbar la suite entera; reintenta en CI.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /**
   * Arranca el servidor de desarrollo del frontend antes de las pruebas.
   * `BROWSER=none` evita que CRA abra una pestaña del navegador.
   * `reuseExistingServer` reutiliza el server si ya lo tienes corriendo en local.
   */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      BROWSER: 'none',
    },
  },
});
