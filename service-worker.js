// Service Worker for Moji Code
const CACHE_NAME = 'moji-code-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/client/css/effects.css',
    '/client/css/animations.css',
    '/client/css/editor.css',
    '/client/js/effects.js',
    '/client/js/ai.js',
    '/client/js/database.js',
    '/client/js/media-editor.js',
    '/client/js/post-creator.js',
    '/client/js/ui.js',
    '/client/js/session.js',
    '/client/js/media.js',
    '/assets/default-avatar.jpg',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Fetch event - handle offline support
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Handle API requests
    if (event.request.url.includes('/api/')) {
        return handleApiRequest(event);
    }

    // Handle static assets
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then((response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
    );
});

// Handle API requests with background sync
function handleApiRequest(event) {
    // Check if browser supports Background Sync
    if ('sync' in self.registration) {
        event.respondWith(
            fetch(event.request.clone())
                .catch((error) => {
                    // Save failed request to IndexedDB for later
                    saveRequestForSync(event.request);
                    return caches.match(event.request);
                })
        );
    }
}

// Background sync event
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-posts') {
        event.waitUntil(
            // Get failed requests from IndexedDB and retry them
            getPendingRequests()
                .then((requests) => {
                    return Promise.all(
                        requests.map((request) => {
                            return fetch(request);
                        })
                    );
                })
        );
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/assets/icon-192.png',
        badge: '/assets/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details',
                icon: '/assets/checkmark.png'
            },
            {
                action: 'close',
                title: 'Dismiss',
                icon: '/assets/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Moji Code', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        // Open the relevant page
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});