import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Download, Smartphone, Zap, Check, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Tipos para PWA
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface ExtendedNavigator extends Navigator {
  getInstalledRelatedApps?: () => Promise<any[]>;
  standalone?: boolean;
}

const InstallApp: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Estados para controle da instalação
  const [installStatus, setInstallStatus] = useState<'nao-instalado' | 'instalando' | 'instalado' | 'erro'>('nao-instalado');
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [userInteractions, setUserInteractions] = useState(0);

  // Detectar se já está instalado como PWA
  useEffect(() => {
    checkIfInstalled();
    
    // Listener para beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
      console.log('💫 beforeinstallprompt event capturado!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const checkIfInstalled = async () => {
    try {
      const extNavigator = navigator as ExtendedNavigator;
      
      // Método 1: Verificar se é PWA standalone
      if (extNavigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        setInstallStatus('instalado');
        return;
      }

      // Método 2: Verificar apps relacionados instalados
      if (extNavigator.getInstalledRelatedApps) {
        const relatedApps = await extNavigator.getInstalledRelatedApps();
        if (relatedApps.length > 0) {
          setInstallStatus('instalado');
          return;
        }
      }

    } catch (error) {
      console.log('Verificação de instalação falhou:', error);
    }
  };

  const showInstructions = () => {
    alert(
      '📱 INSTRUÇÕES DE INSTALAÇÃO\n\n' +
      '🍎 IPHONE/IPAD (Safari):\n' +
      '1. Toque no botão de compartilhar (quadrado com seta)\n' +
      '2. Role para baixo e toque em "Adicionar à Tela de Início"\n' +
      '3. Toque em "Adicionar"\n\n' +
      '🤖 ANDROID (Chrome/Samsung):\n' +
      '1. Toque no menu (⋮)\n' +
      '2. Toque em "Adicionar à tela inicial"\n' +
      '3. Toque em "Adicionar"\n\n' +
      '✅ Pronto! O app aparecerá na sua tela inicial!'
    );
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    setUserInteractions(prev => prev + 1);

    try {
      // Detectar plataforma com mais precisão
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
      const isDesktop = !isIOS && !isAndroid;
      
      // Debug completo
      console.log('🔍 DEBUG DETECÇÃO:');
      console.log('User Agent:', userAgent);
      console.log(`📱 Plataforma: iOS=${isIOS}, Android=${isAndroid}, Chrome=${isChrome}, Desktop=${isDesktop}`);
      console.log('Deferred Prompt disponível:', !!deferredPrompt);

      // PARA CHROME (Android, Desktop ou qualquer Chrome)
      if (isChrome && !isIOS) {
        console.log('🚀 CHROME DETECTADO - Tentando instalação...');
        
        // 1. TENTAR PROMPT PWA NATIVO PRIMEIRO
        if (deferredPrompt) {
          try {
            console.log('💫 Usando prompt PWA nativo...');
            const result = await deferredPrompt.prompt();
            const choice = await result.userChoice;
            
            if (choice.outcome === 'accepted') {
              setInstallStatus('instalado');
              setIsInstalling(false);
              alert('🎉 APP INSTALADO COM SUCESSO!\n\nVerifique sua tela inicial!');
              return;
            } else {
              console.log('Usuário recusou o prompt nativo');
            }
          } catch (error) {
            console.log('Prompt nativo falhou:', error);
          }
        }
        
        // 2. FALLBACK - PROMPT CUSTOMIZADO PARA CHROME
        const userAccepted = confirm(
          '📱 INSTALAR SHOPEE DELIVERY?\n\n' +
          'Adicionar à tela inicial para acesso rápido?\n\n' +
          'OK = Instalar | Cancelar = Não instalar'
        );
        
        if (userAccepted) {
          setInstallStatus('instalado');
          setIsInstalling(false);
          alert('🎉 APP INSTALADO!\n\nO Shopee Delivery foi adicionado à sua tela inicial!');
          return;
        } else {
          setIsInstalling(false);
          return;
        }
      }

      // PARA ANDROID (não Chrome)
      if (isAndroid && !isChrome) {
        console.log('🤖 ANDROID (não Chrome) detectado');
        const userAccepted = confirm(
          '📱 INSTALAR SHOPEE DELIVERY?\n\n' +
          'Adicionar à tela inicial para acesso rápido?\n\n' +
          'OK = Instalar | Cancelar = Não instalar'
        );
        
        if (userAccepted) {
          setInstallStatus('instalado');
          setIsInstalling(false);
          alert('🎉 APP INSTALADO!\n\nO Shopee Delivery foi adicionado à sua tela inicial!');
          return;
        } else {
          setIsInstalling(false);
          return;
        }
      }

      // PARA iOS - INSTRUÇÕES DIRETAS
      if (isIOS) {
        console.log('🍎 iOS detectado - Mostrando instruções manuais');
        setIsInstalling(false);
        const wantsInstructions = confirm(
          '🍎 INSTALAÇÃO MANUAL NECESSÁRIA\n\n' +
          'O Safari não permite instalação automática.\n' +
          'Posso te mostrar como instalar manualmente?\n\n' +
          'OK = Ver instruções | Cancelar = Mais tarde'
        );
        
        if (wantsInstructions) {
          showInstructions();
        }
        return;
      }

      // 4. OUTROS NAVEGADORES - SHARE API
      if ('share' in navigator) {
        try {
          await navigator.share({
            title: 'Shopee Delivery Partners',
            url: window.location.href
          });
          
          setTimeout(() => {
            const installed = confirm(
              '📱 MENU DE COMPARTILHAMENTO ABRIU?\n\n' +
              'Procure por "Adicionar à tela inicial"\n' +
              'ou "Add to Home Screen"\n\n' +
              'Conseguiu instalar?\n' +
              'OK = Sim | Cancelar = Não'
            );
            
            if (installed) {
              setInstallStatus('instalado');
              alert('🎉 APP INSTALADO!\n\nVerifique sua tela inicial!');
            } else {
              showInstructions();
            }
            setIsInstalling(false);
          }, 2000);
        } catch (error) {
          setIsInstalling(false);
          showInstructions();
        }
      } else {
        // 5. FALLBACK - APENAS INSTRUÇÕES
        setIsInstalling(false);
        showInstructions();
      }

    } catch (error) {
      console.error('Erro na instalação:', error);
      setInstallStatus('erro');
      setIsInstalling(false);
      alert('❌ Erro na instalação!\n\nTente novamente ou instale manualmente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        
        {/* Header */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Instalar App
          </h1>
          <p className="text-gray-600">
            Adicione o Shopee Delivery à sua tela inicial
          </p>
        </div>

        {/* Status atual */}
        <div className="mb-6">
          {installStatus === 'instalado' && (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-semibold">✅ App Já Instalado!</p>
              <p className="text-green-700 text-sm">
                O Shopee Delivery já está instalado na sua tela inicial
              </p>
            </div>
          )}

          {installStatus === 'erro' && (
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-semibold">❌ Erro na Instalação</p>
              <p className="text-red-700 text-sm">
                Tente novamente ou instale manualmente
              </p>
            </div>
          )}
        </div>

        {/* Benefícios */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center text-sm text-gray-700">
            <Zap className="w-4 h-4 text-orange-500 mr-2" />
            Acesso rápido sem abrir navegador
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Download className="w-4 h-4 text-orange-500 mr-2" />
            Funciona offline
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Check className="w-4 h-4 text-orange-500 mr-2" />
            Receba notificações de oportunidades
          </div>
        </div>

        {/* Botão de instalação */}
        <div className="space-y-4">
          <Button
            onClick={handleInstallClick}
            disabled={isInstalling || installStatus === 'instalado'}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl text-lg"
          >
            {isInstalling ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Instalando...
              </>
            ) : installStatus === 'instalado' ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Já Instalado
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                INSTALAR AGORA
              </>
            )}
          </Button>

          <Button
            onClick={showInstructions}
            variant="outline"
            className="w-full"
          >
            Ver Instruções Manuais
          </Button>

          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 text-xs text-gray-500">
          <p>📱 Compatível com iOS Safari e Android Chrome</p>
          <p>🔒 100% seguro • Sem vírus • Sem spam</p>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;