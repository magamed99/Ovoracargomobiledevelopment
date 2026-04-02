import { useEffect, useState } from 'react';

/**
 * 🚀 ОПТИМИЗАЦИЯ: Debounce хук
 * Задерживает обновление значения для уменьшения количества запросов
 * Используется для поиска и фильтрации
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
