// Восстановление после "Failed to fetch dynamically imported module".
// После нового деплоя уже открытая вкладка ссылается на старые content-hashed
// чанки, которых на сервере больше нет. Простой reload не помогает, если
// Service Worker отдаёт устаревший кеш — поэтому сначала чистим кеши и снимаем
// SW, и только потом перезагружаемся (с защитой от цикла перезагрузок).

const RELOAD_GUARD_KEY = 'ovora_chunk_reload_ts';
const GUARD_MS = 15_000;

/** Это ошибка устаревшего динамического чанка после деплоя? */
export function isStaleChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i.test(msg);
}

/**
 * Один раз чистит кеши + снимает Service Worker и перезагружает страницу,
 * чтобы подтянуть свежий app shell. Защита по таймстампу не даёт зациклиться,
 * если деплой реально сломан.
 */
export async function recoverFromStaleChunk(force = false): Promise<void> {
  if (!force) {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - last < GUARD_MS) return; // уже пробовали недавно — не зацикливаемся
  }
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
  } catch { /* ignore */ }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch { /* ignore */ }

  window.location.reload();
}

/**
 * Глобальный слушатель Vite-события `vite:preloadError` — ловит сбой
 * подгрузки чанка раньше, чем он всплывёт как ошибка роута.
 */
export function installStaleChunkHandler(): void {
  window.addEventListener('vite:preloadError', (e: Event) => {
    e.preventDefault(); // не даём ошибке уронить приложение
    void recoverFromStaleChunk();
  });
}
