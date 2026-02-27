const CACHE_NAME = 'transport-corp-v3';
const MAX_CACHE_SIZE = 20;

// Install: skip waiting immediately, don't try to cache anything on install
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate: delete ALL old caches aggressively
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    console.log('[SW] Deleting cache:', name);
                    return caches.delete(name);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network only for most things, cache only small navigation assets
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Never cache these
    const skipUrls = ['/api/', '/socket.io/', '/uploads/', 'giphy.com', 'googleapis.com', 'firebase', 'dicebear', 'chrome-extension'];
    if (skipUrls.some(url => event.request.url.includes(url))) return;
    if (!event.request.url.startsWith('http')) return;

    // Only cache navigation requests (HTML pages) for offline support
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html') || new Response('Offline', { status: 503 });
            })
        );
        return;
    }

    // For JS/CSS assets: network first, cache fallback, but DON'T proactively cache
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then(cached => {
                return cached || new Response('Offline', { status: 503 });
            });
        })
    );
});

// Push notifications
self.addEventListener('push', (event) => {
    let data = { title: 'Employ Management App', body: 'You have a new notification' };
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'Employ Management App', body: event.data.text() };
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Employ Management App', {
            body: data.body || data.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: data,
        })
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
