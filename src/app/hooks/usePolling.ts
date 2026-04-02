import { useEffect, useRef, useCallback } from 'react';

/**
 * Centralized polling hook:
 * - Auto-pauses when browser tab is hidden (saves battery/bandwidth)
 * - Resumes immediately when tab becomes visible again
 * - Passes AbortSignal to callback for clean fetch cancellation
 * - Runs immediately on mount (no initial delay)
 */
export function usePolling(
  fn: (signal: AbortSignal) => Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      await fnRef.current(abortRef.current.signal);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('[usePolling] error:', err?.message ?? err);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    run();
    timerRef.current = setInterval(run, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [run, intervalMs, enabled]);
}
