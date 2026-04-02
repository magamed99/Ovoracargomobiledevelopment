import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import { TripsProvider } from './contexts/TripsContext';
import { AviaProvider } from './components/avia/AviaContext';
import { YandexMetrika } from './components/YandexMetrika';
import { initYandexApiKey } from './config/yandex';

function AppLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E1621' }}>
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#1978e5] to-[#0d4d99] flex items-center justify-center shadow-xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4"
          style={{ borderColor: '#1e3a55', borderTopColor: '#5ba3f5' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#e7f0f3' }}>Ovora Cargo</h2>
        <p style={{ color: '#607080' }}>Загрузка приложения...</p>
        <div className="mt-4 w-64 mx-auto">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e2d3d' }}>
            <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: 'linear-gradient(90deg, #1978e5, #5ba3f5)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) existingMeta.parentNode?.removeChild(existingMeta);
    document.head.appendChild(meta);

    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#17212B';
    document.head.appendChild(themeColor);

    document.body.style.overscrollBehavior = 'none';

    initYandexApiKey().then((key) => {
      if (key) console.log('[App] Yandex Maps API initialized successfully');
      else console.warn('[App] Yandex Maps API key not loaded');
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);
            setInterval(() => { registration.update(); }, 5 * 60 * 1000);
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });

      // Handle NAVIGATE messages from SW (push notification click)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NAVIGATE' && event.data?.url) {
          window.location.href = event.data.url;
        }
      });
    }
  }, []);

  // RouterProvider handles its own Suspense internally via startTransition.
  // Do NOT wrap it in <Suspense> — that causes "suspended during synchronous input" errors
  // because the outer boundary intercepts suspensions before React Router's transition fires.
  // Use `fallbackElement` prop instead for the initial loading state.
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <TripsProvider>
            <AviaProvider>
              <RouterProvider
                router={router}
                fallbackElement={<AppLoadingFallback />}
              />
              <Toaster
                position="top-center"
                theme="dark"
                toastOptions={{
                  style: {
                    background: '#0c1a2a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#ddeeff',
                    fontSize: 13,
                    borderRadius: 14,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  },
                }}
                richColors
              />
              <YandexMetrika />
            </AviaProvider>
          </TripsProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}