/**
 * 🚀 ОПТИМИЗАЦИЯ: Утилиты для кэширования
 * Сохраняет данные в памяти для быстрого доступа
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  private maxAge: number; // в миллисекундах

  constructor(maxAge: number = 5 * 60 * 1000) { // 5 минут по умолчанию
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Получить данные из кэша
   * Возвращает null если данных нет или они устарели
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.maxAge;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Удалить данные из кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Проверить наличие данных в кэше
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const isExpired = Date.now() - item.timestamp > this.maxAge;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Создаём глобальные экземпляры кэша
export const apiCache = new Cache(5 * 60 * 1000); // 5 минут для API
export const imageCache = new Cache(30 * 60 * 1000); // 30 минут для изображений
export const userCache = new Cache(10 * 60 * 1000); // 10 минут для данных пользователя

/**
 * Обёртка для fetch с кэшированием
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheTime?: number
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
  
  // Проверяем кэш
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log(`[Cache] ✅ Hit: ${url}`);
    return cached;
  }

  console.log(`[Cache] ❌ Miss: ${url}`);
  
  // Делаем запрос
  const response = await fetch(url, options);
  const data = await response.json() as T;
  
  // Сохраняем в кэш
  apiCache.set(cacheKey, data);
  
  return data;
}
