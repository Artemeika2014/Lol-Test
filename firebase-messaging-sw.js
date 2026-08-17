importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCl9xOzUawqggpwyZQupGYm67RiWT42b7A",
  authDomain: "lol-messenger-76286.firebaseapp.com",
  projectId: "lol-messenger-76286",
  storageBucket: "lol-messenger-76286.firebasestorage.app",
  messagingSenderId: "573143866457",
  appId: "1:573143866457:web:fb7ed67ea66848e6da2548",
  vapidKey: "BJupW7z5tXhbCnLoTrbJNTrnzYtzJvbBxcRqe5GF5Gl_a1cin_paSM19yWBXq6W5DV_wY3Fl1352IOs5aR8lDFk"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('📨 Фоновое уведомление:', payload);
  
  const notificationTitle = payload.notification?.title || 'Новое сообщение';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});
