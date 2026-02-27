const CACHE_NAME = 'transport-corp-v2';
const MAX_CACHE_SIZE = 30; // Maximum number of items in cache

// Only cache essential static assets during install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - cache only critical static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.warn('SW install cache failed:', err);
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Helper: Trim cache to prevent quota exceeded
const trimCache = async (cacheName, maxItems) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        // Delete oldest entries first
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map((key) => cache.delete(key)));
    }
};

// Fetch event - network first, selective caching
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests - always go to network
    if (event.request.url.includes('/api/')) return;

    // Skip socket.io requests
    if (event.request.url.includes('/socket.io/')) return;

    // Skip large media files, uploads, and external URLs
    if (event.request.url.includes('/uploads/')) return;
    if (event.request.url.includes('giphy.com')) return;
    if (event.request.url.includes('googleapis.com')) return;
    if (event.request.url.includes('firebase')) return;
    if (event.request.url.includes('dicebear.com')) return;

    // Skip chrome-extension and non-http requests
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses that are reasonable size
                if (response.ok && response.status === 200) {
                    const contentLength = response.headers.get('content-length');
                    const size = contentLength ? parseInt(contentLength) : 0;

                    // Don't cache responses larger than 2MB
                    if (size < 2 * 1024 * 1024) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone).catch(() => {
                                // Silently fail if quota is exceeded
                            });
                            // Trim cache to prevent buildup
                            trimCache(CACHE_NAME, MAX_CACHE_SIZE);
                        });
                    }
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        // If the request is for a page, return the cached index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503, statusText: 'Offline' });
                    });
            })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    let data = { title: 'Transport Corporation', body: 'You have a new notification' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: data,
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Transport Corporation', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow('/');
            })
    );
});
