import { useEffect, useRef } from 'react';

/**
 * Hook для отслеживания монтирования компонента
 * Помогает избежать ошибок при установке state после размонтирования
 */
export function useIsMounted() {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
