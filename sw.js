const CACHE_NAME = 'cyber-league-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/fantasy.html',
  '/admin.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;800&display=swap',
  'https://i.postimg.cc/yd079WZs/Logopit-1785006097680.png',
  'https://i.postimg.cc/V6FjPcfY/ab20788ad7f0bb063413446484d6c706.jpg'
];

// 1. مرحلة التثبيت (Install): تخزين الملفات الأساسية في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم تخزين ملفات الموقع الأساسية بنجاح في الكاش');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. مرحلة التفعيل (Activate): تنظيف الكاش القديم إن وجد
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. مرحلة جلب الطلبات (Fetch): الرد من الكاش أولاً، ثم الشبكة
self.addEventListener('fetch', (event) => {
  // نتجاوز طلبات قاعدة بيانات Firebase لأنها تتطلب اتصالاً حياً ولحظياً
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // إرجاع الملف من الكاش لسرعة فائقة
      }
      return fetch(event.request).catch(() => {
        // إذا انقطع الإنترنت ولم يكن الملف موجوداً في الكاش
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
