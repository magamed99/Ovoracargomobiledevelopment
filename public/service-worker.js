// Service Worker для Ovora Cargo PWA
const CACHE_VERSION = 'v3.0.0';
const STATIC_CACHE  = `ovora-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ovora-dynamic-${CACHE_VERSION}`;

// Статика — файлы с хешем в имени, никогда не меняются
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(woff2?|ttf|otf|eot)$/.test(url.pathname)
  );
}

// Изображения
function isImage(url) {
  return /\.(png|jpg|jpeg|webp|svg|ico|gif|avif)$/.test(url.pathname);
}

// Установка
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(['/', '/manifest.json'])
    )
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(n => n !== STATIC_CACHE && n !== DYNAMIC_CACHE)
          .map(n => caches.delete(n))
      )
    )
  );
  return self.clients.claim();
});

// Fetch — разные стратегии для разных ресурсов
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Только GET-запросы к нашему домену
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  // Не кешируем Supabase
  if (url.origin.includes('supabase.co')) return;

  if (isImmutableAsset(url) || isImage(url)) {
    // Cache First: статика с хешем — служим из кеша мгновенно
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          }
          return response;
        });
      })
    );
  } else {
    // Network First: HTML и манифест — проверяем обновления
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('/'))
        )
    );
  }
});

// Push уведомления
self.addEventListener('push', event => {
  let data = {
    title: 'Ovora Cargo',
    body: 'У вас новое уведомление',
    icon: '/icons/logo-bird.png',
    tag: 'notification',
    url: '/notifications',
  };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      tag: data.tag,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
