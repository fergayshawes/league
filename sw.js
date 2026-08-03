const CACHE_NAME = 'cyber-league-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/fantasy.html',
  '/admin.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;800&display=swap',
  'https://i.postimg.cc/yd079WZs/Logopit-1785006097680.png',
  'https://i.postimg.cc/V6FjPcfY/ab20788ad7f0bb063413446484d6c706.jpg',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js'
];

// 1. مرحلة التثبيت (Install): تخزين كافة الملفات الأساسية ومكتبات الـ Firebase في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم تخزين ملفات الموقع الأساسية ومكتبات الـ Firebase بنجاح');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. مرحلة التفعيل (Activate): تنظيف الكاش القديم إن وجد وتحديث الإصدار
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

// 3. مرحلة جلب الطلبات (Fetch): التعامل الذكي مع طلبات الشبكة والكاش وتخزين البيانات مؤقتاً
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // إذا كان الطلب موجهاً لقاعدة بيانات Firebase مباشرة (Realtime Database)
  if (requestUrl.hostname.includes('firebaseio.com')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // نسخ واستجابة الرد وتخزينه مؤقتاً في الكاش عند توفر الإنترنت لاستخدامه أوفلاين
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // إذا انقطع الإنترنت، جلب آخر نسخة مخزنة من بيانات الدوري والمباريات من الكاش
          return caches.match(event.request);
        })
    );
    return;
  }

  // بقية الطلبات والملفات الثابتة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; 
      }
      return fetch(event.request).then((response) => {
        return response;
      }).catch(() => {
        // إذا انقطع الإنترنت ولم يكن الملف موجوداً في الكاش، يتم إرجاع الصفحة الرئيسية
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
