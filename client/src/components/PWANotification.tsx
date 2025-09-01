import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

const PWANotification: React.FC = () => {
  const { toast } = useToast();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Função para solicitar permissão e enviar notificação nativa
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Enviar notificação nativa
          new Notification('📢 Shopee Delivery - Aviso Importante', {
            body: 'Para se tornar entregador Shopee, é necessário adquirir o Kit de Segurança oficial por R$ 47,90.',
            icon: '/shopee-icon.jpg',
            badge: '/shopee-icon.jpg',
            requireInteraction: true, // Mantém a notificação até o usuário interagir
            tag: 'shopee-payment-notification' // Evita duplicatas
          });
          console.log('✅ Notificação push enviada com sucesso!');
        } else {
          console.log('⚠️ Permissão para notificações negada, usando toast como fallback');
          // Fallback para toast se permissão for negada
          showToastNotification();
        }
      } catch (error) {
        console.error('❌ Erro ao solicitar permissão para notificações:', error);
        // Fallback para toast em caso de erro
        showToastNotification();
      }
    } else {
      console.log('⚠️ Notificações não suportadas, usando toast');
      // Fallback para toast se notificações não forem suportadas
      showToastNotification();
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
    // Verificar se está rodando em modo PWA (standalone)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone ||
                  document.referrer.includes('android-app://');

    // Verificar se já mostrou a notificação nesta sessão
    const notificationShown = sessionStorage.getItem('pwa_payment_notification_shown');

    if (isPWA && !notificationShown && !hasShownNotification) {
      console.log('🔔 App PWA detectado, preparando notificação...');
      
      // Aguardar um pouco para garantir que a página carregou completamente
      const timer = setTimeout(() => {
        // Tentar enviar notificação nativa primeiro
        requestNotificationPermission();
        
        // Marcar que a notificação foi mostrada nesta sessão
        sessionStorage.setItem('pwa_payment_notification_shown', 'true');
        setHasShownNotification(true);
      }, 2000); // Aguardar 2 segundos após o carregamento

      return () => clearTimeout(timer);
    }
  }, [toast, hasShownNotification]);

  return null; // Este componente não renderiza nada visível
};

export default PWANotification;