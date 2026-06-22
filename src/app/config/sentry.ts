/**
 * Sentry monitoring (см. IMPROVEMENTS.md, пункт 0.3).
 * DSN передаётся через VITE_SENTRY_DSN — если переменная не задана
 * (например, локальная разработка без .env.local), Sentry просто не
 * инициализируется и приложение работает как обычно.
 */
import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
