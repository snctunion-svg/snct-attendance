// SNCT 근태관리 서비스워커: 앱 설치를 가능하게 하고, 인터넷이 끊겼을 때 마지막으로 받은 화면을 보여줌.
// 항상 최신 파일을 먼저 받아오므로(network-first) GitHub에 새로 올린 내용이 바로 반영됨.
const CACHE = 'snct-attendance-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-pink-192.png', './icon-pink-512.png', './apple-touch-icon-pink.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase 등 외부 요청은 건드리지 않음
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
