import { useEffect, useId, useRef } from 'react';

// Пока VITE_TURNSTILE_SITE_KEY не задан — виджет не рендерится и токен не
// требуется (backend тоже пропускает проверку без TURNSTILE_SECRET_KEY,
// см. supabase/functions/make-server-4e36197a/turnstile.tsx). Это позволяет
// включить капчу без даунтайма: сперва задать секрет на backend, потом —
// сайт-ключ на frontend.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if ((window as any).turnstile) return resolve();
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface TurnstileProps {
  onVerify: (token: string | null) => void;
  theme?: 'light' | 'dark' | 'auto';
}

/** Cloudflare Turnstile — невидимая/лёгкая капча перед формами регистрации/логина/OTP. */
export function Turnstile({ onVerify, theme = 'dark' }: TurnstileProps) {
  const containerId = useId().replace(/:/g, '');
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) {
      onVerify(null);
      return;
    }
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled) return;
      const turnstile = (window as any).turnstile;
      if (!turnstile) return;
      widgetIdRef.current = turnstile.render(`#${containerId}`, {
        sitekey: SITE_KEY,
        theme,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => onVerify(null),
        'error-callback': () => onVerify(null),
      });
    }).catch(() => onVerify(null));

    return () => {
      cancelled = true;
      const turnstile = (window as any).turnstile;
      if (turnstile && widgetIdRef.current) {
        try { turnstile.remove(widgetIdRef.current); } catch { /* noop */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  if (!SITE_KEY) return null;
  return <div id={containerId} className="flex justify-center my-2" />;
}
