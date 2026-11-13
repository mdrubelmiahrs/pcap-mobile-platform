const CACHE="pcap-shell-v2";
const FILES=["./","./index.html","./styles.css","./app.js","./config.js","./manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("pcap-shell-")&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
