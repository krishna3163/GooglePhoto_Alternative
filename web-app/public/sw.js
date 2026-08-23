const CACHE_NAME = 'telegphoto-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle standard HTTP/HTTPS requests (ignore chrome-extension:// etc.)
    if (!event.request || !event.request.url || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request).catch(() => {
                // If offline or network error, return empty response or cached fallback
                return new Response('', { status: 408, statusText: 'Request timed out or offline' });
            });
        })
    );
});


