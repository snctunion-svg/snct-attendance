// SNCT 근태관리 서비스워커: 앱 설치를 가능하게 하고, 인터넷이 끊겼을 때 마지막으로 받은 화면을 보여줌.
// 항상 최신 파일을 먼저 받아오므로(network-first) GitHub에 새로 올린 내용이 바로 반영됨.
// + 배차완료 푸시 알림: 화면이 꺼져 있거나 앱을 닫아도 "✅ N조 배차완료" 알림을 띄움.
const CACHE = 'snct-attendance-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-snct-192.png', './icon-snct-512.png', './apple-touch-icon-snct.png'];
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

// ===== 푸시 알림 받기 =====
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) { p = {}; }
  const d = p.data || p;                       // FCM은 {data:{...}} 모양으로 보냄
  const n = p.notification || {};
  const title = d.title || n.title || '장비관리';
  const opts = {
    body: d.body || n.body || '',
    tag: d.tag || 'snct',
    renotify: true,
    icon: 'icon-snct-192.png',
    badge: 'icon-snct-192.png',
    vibrate: [300, 150, 300],
    data: { url: d.url || './' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});
// 알림을 누르면 앱을 열거나(이미 열려 있으면 그 창으로)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
