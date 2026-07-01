import { defineConfig, devices } from '@playwright/test';

// E2E-смоук-тесты — проверяют именно то, что раньше ломалось молча в проде:
// ToS/Privacy доступны без логина, hero переводится на все языки, формы
// не крашат при невалидном вводе. Никаких мутирующих запросов к реальному
// бэкенду (регистрация/логин) — только рендер + клиентская валидация,
// чтобы CI не жёг реальные rate-limit/OTP-квоты при каждом пуше.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 20_000,
  use: {
    // Слэш в конце обязателен — иначе относительные page.goto('email-auth')
    // заменяют последний сегмент базового URL вместо добавления к нему.
    baseURL: 'http://localhost:4173/Ovoracargomobiledevelopment/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Локальная песочница кэширует Chromium под другой ревизией, чем
        // требует установленный @playwright/test — используем готовый
        // бинарь напрямую вместо повторной загрузки. В CI (GitHub Actions)
        // этот путь не существует, там playwright install сам ставит нужную
        // версию — поэтому включаем override только если файл реально есть.
        ...(process.env.CI ? {} : { launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } }),
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/Ovoracargomobiledevelopment/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
