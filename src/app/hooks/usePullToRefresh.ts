import { useRef, useState, useCallback } from 'react';

interface Options {
  onRefresh: () => Promise<void>;
  threshold?: number; // px to pull before triggering, default 75
}

export interface PullToRefreshHandlers {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pullY: number;             // current pull distance (0–threshold+20), use for spinner opacity/translate
  isRefreshing: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove:  (e: React.TouchEvent) => void;
  onTouchEnd:   () => void;
}

/**
 * Mobile pull-to-refresh hook.
 * Attach containerRef to the scrollable wrapper.
 * When user pulls down past `threshold` px, `onRefresh` is called.
 */
export function usePullToRefresh({ onRefresh, threshold = 75 }: Options): PullToRefreshHandlers {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY       = useRef(0);
  const [pullY, setPullY]           = useState(0);
  const [isRefreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 2) return; // only trigger at top
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 2) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      // Rubber-band effect: resistance increases as user pulls further
      const rubberBand = Math.min(dy * 0.45, threshold + 30);
      setPullY(rubberBand);
    }
  }, [isRefreshing, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= threshold && !isRefreshing) {
      setRefreshing(true);
      setPullY(55); // hold spinner visible while refreshing
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  }, [pullY, threshold, isRefreshing, onRefresh]);

  return { containerRef, pullY, isRefreshing, onTouchStart, onTouchMove, onTouchEnd };
}
