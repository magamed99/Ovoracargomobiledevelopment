// Заголовок против CSRF на мутирующих запросах (см. IMPROVEMENTS.md, пункт 0.6).
// У бэкенда нет cookie-сессий — авторизация целиком в заголовках, поэтому
// классический double-submit cookie неприменим. Вместо этого: любой кастомный
// заголовок форсирует CORS preflight, который уже отклоняется для origin вне
// allowlist (см. ALLOWED_ORIGINS в index.ts) — а без preflight браузер не
// отправит сам запрос. Значение не секрет — его роль чисто механическая.
export const CSRF_HEADER = 'X-Csrf-Token';
export const CSRF_TOKEN = 'ovora-pwa-v1';
