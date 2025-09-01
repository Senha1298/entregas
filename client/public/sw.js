// Service Worker para PWA com Push Notifications
const CACHE_NAME = 'shopee-delivery-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/instalar-app',
  '/cadastro',
  '/treinamento',
  '/shopee-icon.jpg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
  // Ativar imediatamente o novo Service Worker
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Controlar imediatamente todas as páginas
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// ===== PUSH NOTIFICATIONS =====

// Receber push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recebida:', event);
  
  let notificationData = {
    title: 'Shopee Delivery',
    body: 'Nova notificação!',
    icon: '/shopee-icon.jpg',
    badge: '/shopee-icon.jpg',
    data: {}
  };

  // Tentar parsear dados do push
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || 'shopee-notification',
        data: data.data || notificationData.data,
        actions: data.actions,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      };
    } catch (e) {
      console.error('❌ Erro ao parsear dados do push:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  console.log('📢 Exibindo notificação:', notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada:', event.notification);
  
  // Fechar a notificação
  event.notification.close();
  
  // Abrir ou focar na janela do app
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Se há uma janela aberta, focar nela
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      
      // Se não há janela aberta, abrir uma nova
      if (self.clients.openWindow) {
        const targetUrl = event.notification.data?.url || '/';
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificação fechada:', event.notification);
  // Aqui podemos enviar analytics sobre notificações fechadas
});

// Message handling (para comunicação com a página)
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida no SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});