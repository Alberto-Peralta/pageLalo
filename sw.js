// Service worker mínimo: habilita la instalación de la app (PWA).
// No guarda nada en caché, así el sitio siempre se carga actualizado.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
