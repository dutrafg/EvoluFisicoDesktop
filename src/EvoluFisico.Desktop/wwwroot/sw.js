/* Desktop WebView2: a origem HTTPS virtual distribui o frontend completo offline. */
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('evolufisico-'))await caches.delete(key);await self.registration.unregister();})()));
