import { useEffect } from 'react';
import { useLocation } from 'react-router';

// Set VITE_YANDEX_METRIKA_ID in your .env file to enable analytics
const YANDEX_METRIKA_ID = (import.meta.env.VITE_YANDEX_METRIKA_ID as string) || '';

/**
 * 📊 YANDEX METRIKA - Внутренний компонент
 * Должен использоваться ВНУТРИ Router контекста
 */
function YandexMetrikaInner() {
  const location = useLocation();

  // Отслеживание переходов между страницами
  useEffect(() => {
    if (YANDEX_METRIKA_ID && window.ym) {
      window.ym(YANDEX_METRIKA_ID, 'hit', window.location.href, {
        title: document.title,
      });
    }
  }, [location]);

  return null;
}

/**
 * 📊 YANDEX METRIKA - Основной компонент
 * Инициализирует счётчик и рендерит noscript fallback
 */
export function YandexMetrika() {
  useEffect(() => {
    if (!YANDEX_METRIKA_ID) return;
    // Инициализация Yandex Metrika
    if (typeof window !== 'undefined' && !window.ym) {
      (function(m: any, e: any, t: any, r: any, i: any, k: any, a: any) {
        m[i] = m[i] || function() { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date().getTime();
        k = e.createElement(t);
        a = e.getElementsByTagName(t)[0];
        k.async = 1;
        k.src = r;
        a.parentNode.insertBefore(k, a);
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

      window.ym(YANDEX_METRIKA_ID, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
        trackHash: true,
        ecommerce: 'dataLayer',
      });

      console.log('[Analytics] Yandex Metrika initialized');
    }
  }, []);

  return (
    <noscript>
      <div>
        <img 
          src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
          style={{ position: 'absolute', left: '-9999px' }} 
          alt="" 
        />
      </div>
    </noscript>
  );
}

/**
 * 📊 YANDEX METRIKA TRACKER
 * Компонент для отслеживания навигации.
 * ВАЖНО: Должен быть размещён ВНУТРИ Router!
 */
export function YandexMetrikaTracker() {
  return <YandexMetrikaInner />;
}