const CACHE = 'moment-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests; don't interfere with POST/PUT/DELETE
  if(e.request.method!=='GET')return;
  // Network first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(function(r) {
        if(r.ok){var c=caches.open(CACHE);c.then(function(ca){ca.put(e.request,r.clone())})}
        return r;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(cl) {
      if (cl.length > 0) {
        cl[0].focus();
        cl[0].navigate('/');
      } else {
        clients.openWindow('/');
      }
    })
  );
});