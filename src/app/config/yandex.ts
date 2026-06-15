/**
 * Конфигурация Яндекс.Карт
 * API ключ получен из: https://developer.tech.yandex.ru/
 * 
 * Ключ загружается асинхронно с сервера, т.к. секреты нельзя передавать в браузер напрямую.
 * Реализован retry с exponential backoff для устойчивости к холодному старту Edge Function.
 */

import { projectId, publicAnonKey } from '../../../utils/supabase/info';

let cachedApiKey: string | null = null;
let initPromise: Promise<string> | null = null;

export const YANDEX_MAPS_CONFIG = {
  get apiKey(): string {
    return cachedApiKey || '';
  },
  lang: 'ru_RU',
  version: '2.1'
} as const;

/** Один попытка fetch с таймаутом */
async function fetchYandexKey(timeoutMs = 4000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a/config/yandex-key`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.apiKey || '';
    }

    return '';
  } finally {
    clearTimeout(timer);
  }
}

/** Retry с exponential backoff */
async function fetchWithRetry(
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const key = await fetchYandexKey();
      if (key) return key;
    } catch {
      const isLast = attempt === maxAttempts;

      if (isLast) {
        return '';
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return '';
}

/**
 * Загрузить ключ с сервера при старте приложения.
 * Вызов повторного initYandexApiKey() возвращает тот же Promise (singleton).
 */
export async function initYandexApiKey(): Promise<string> {
  // Уже загружен
  if (cachedApiKey !== null) return cachedApiKey;

  // Уже идёт загрузка — возвращаем тот же Promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const key = await fetchWithRetry(2, 500);
    cachedApiKey = key;
    if (!key) {
      console.warn('[Yandex Config] API key not available — карты могут не работать');
    }
    return key;
  })();

  return initPromise;
}