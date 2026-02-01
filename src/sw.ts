import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20 }),
    ],
  })
);

// Cache Supabase Storage Images (Proof of Work, Gallery)
registerRoute(
  ({ url }) => url.origin === 'https://kkfzthsnjixksplgkftu.supabase.co' && url.pathname.startsWith('/storage/v1/object/public/'),
  new CacheFirst({
    cacheName: 'supabase-storage',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache API Requests (Supabase REST) - NetworkFirst for fresh data, fallback to cache
registerRoute(
  ({ url }) => url.origin === 'https://kkfzthsnjixksplgkftu.supabase.co' && url.pathname.startsWith('/rest/v1/'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 Day
      }),
    ],
  })
);

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Geng Kubur', message: 'Notifikasi baru!' };
  
  const options = {
    body: data.message,
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});
