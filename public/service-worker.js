// Service Worker для Ovora Cargo PWA
const CACHE_VERSION = 'v2.0.0-2026-04-30';
const CACHE_NAME = `ovora-cargo-${CACHE_VERSION}`;

// Только shell — статичные файлы, которые точно существуют в production
const urlsToCache = [
  '/',
  '/manifest.json',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  // Активировать новый SW сразу
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Захватить контроль над всеми клиентами
  return self.clients.claim();
});

// Стратегия кеширования: Network First (сеть приоритетнее)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем запросы к API Supabase
  if (url.origin.includes('supabase.co')) {
    return;
  }

  // Пропускаем запросы к внешним API
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Если получен ответ, клонируем его и кешируем
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся вернуть из кеша
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Если нет в кеше, возвращаем офлайн страницу
          return caches.match('/');
        });
      })
  );
});

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('[SW] 📩 Push received');

  let data = {
    title: 'Ovora Cargo',
    body: 'У вас новое уведомление',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'notification',
    url: '/notifications',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 80, 200],
    tag: data.tag,
    requireInteraction: false,
    silent: false,
    data: { url: data.url || '/notifications' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обработка кликов по уведомлениям — открыть приложение на нужной странице
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notification clicked, url:', event.notification.data?.url);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если приложение уже открыто — фокусируем и навигируем
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          } else {
            client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          }
          return;
        }
      }
      // Иначе открываем новую вкладку
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Сообщения от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded successfully');