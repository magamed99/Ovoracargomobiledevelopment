/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  AVIA CACHE LAYER — In-Memory LRU с TTL                     ║
 * ║                                                              ║
 * ║  MIGRATION PATH → Redis:                                     ║
 * ║    Заменить тело каждого метода на Redis-клиент.             ║
 * ║    Интерфейс (get/set/del/delByPrefix) остаётся неизменным.  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  key: string;
}

class LRUCache<T = any> {
  private map   = new Map<string, CacheEntry<T>>();
  private maxSz : number;

  constructor(maxSize = 50_000) {
    this.maxSz = maxSize;
  }

  // ── MIGRATION: replace with `await redis.get(key)` ──────────────────────
  get(key: string): T | null {
    const item = this.map.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.map.delete(key);
      return null;
    }
    // LRU: переставляем в конец
    this.map.delete(key);
    this.map.set(key, item);
    return item.value;
  }

  // ── MIGRATION: replace with `await redis.set(key, JSON.stringify(value), 'PX', ttlMs)` ──
  set(key: string, value: T, ttlMs: number): void {
    if (this.map.size >= this.maxSz) {
      // Вытесняем самый старый ключ (первый в Map — LRU)
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs, key });
  }

  // ── MIGRATION: replace with `await redis.del(key)` ──────────────────────
  del(key: string): void {
    this.map.delete(key);
  }

  // ── MIGRATION: replace with `redis.keys(prefix + '*')` + `redis.del` ───
  delByPrefix(prefix: string): void {
    for (const k of this.map.keys()) {
      if (k.startsWith(prefix)) this.map.delete(k);
    }
  }

  /** Удалить все истёкшие записи. Публичный метод — не требует `as any`. */
  evictExpired(): number {
    const now = Date.now();
    let evicted = 0;
    for (const [k, v] of this.map) {
      if (now > v.expiresAt) {
        this.map.delete(k);
        evicted++;
      }
    }
    return evicted;
  }

  get size(): number { return this.map.size; }
}

// Глобальный экземпляр кеша AVIA (изолирован от остального приложения)
export const aviaCache = new LRUCache(50_000);

// ── TTL-константы (миграция: остаются теми же при переходе на Redis) ─────────
export const TTL = {
  USER_PROFILE  : 5  * 60_000,  // 5 мин  — профиль пользователя
  FLIGHTS_LIST  : 30 * 1_000,   // 30 сек — список рейсов (часто меняется)
  REQUESTS_LIST : 30 * 1_000,   // 30 сек — список заявок
  NOTIF_COUNT   : 10 * 1_000,   // 10 сек — счётчик непрочитанных
  NOTIF_LIST    : 15 * 1_000,   // 15 сек — список уведомлений
  CHAT_META     : 30 * 1_000,   // 30 сек — мета чата
  DEAL          : 60 * 1_000,   // 1 мин  — сделка
  PUBLIC_PROFILE: 10 * 60_000,  // 10 мин — публичный профиль (reviews + stats)
  STATS         : 2  * 60_000,  // 2 мин  — статистика
} as const;

// ── Cache key builders (единая схема имён — совпадает с будущими Redis-ключами) ─
export const CK = {
  user          : (phone: string)            => `avia:user:${phone}`,
  pin           : (phone: string)            => `avia:pin:${phone}`,
  flightsList   : ()                         => `avia:flights:list`,
  requestsList  : ()                         => `avia:requests:list`,
  myFlights     : (phone: string)            => `avia:myflights:${phone}`,
  myRequests    : (phone: string)            => `avia:myrequests:${phone}`,
  notifCount    : (phone: string)            => `avia:notif:count:${phone}`,
  notifList     : (phone: string)            => `avia:notif:list:${phone}`,
  chatMeta      : (chatId: string)           => `avia:chat:meta:${chatId}`,
  userChats     : (phone: string)            => `avia:userchats:${phone}`,
  deal          : (id: string)               => `avia:deal:${id}`,
  userDeals     : (phone: string)            => `avia:userdeals:${phone}`,
  publicProfile : (phone: string)            => `avia:pubprofile:${phone}`,
  stats         : (phone: string)            => `avia:stats:${phone}`,
  reviewsDeal   : (dealId: string)           => `avia:reviews:deal:${dealId}`,
  reviewsUser   : (phone: string)            => `avia:reviews:user:${phone}`,
} as const;

// ── Периодическая чистка истёкших записей (раз в 5 мин) ──────────────────────
setInterval(() => {
  const before  = aviaCache.size;
  const evicted = aviaCache.evictExpired();
  if (evicted > 0) {
    console.log(`[AviaCache] Cleanup: evicted ${evicted} expired entries, ${aviaCache.size} remain (was ${before})`);
  }
}, 5 * 60_000);