import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Download, Smartphone, Zap, Check, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallApp: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Estados para controle da instalação
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Detectar se já está instalado como PWA
  useEffect(() => {
    const checkIfInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkIfInstalled();
    
    // Escutar mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkIfInstalled);
    
    return () => {
      mediaQuery.removeListener(checkIfInstalled);
    };
  }, []);

  const openHowTo = () => {
    alert(
      '📱 COMO INSTALAR:\n\n' +
      '🍎 IPHONE/IPAD:\n' +
      '1. Toque no ícone de compartilhar (quadrado com seta) no Safari\n' +
      '2. Role para baixo e toque em "Adicionar à Tela de Início"\n' +
      '3. Toque em "Adicionar"\n\n' +
      '🤖 ANDROID:\n' +
      '1. Toque no menu (⋮) no Chrome\n' +
      '2. Toque em "Adicionar à tela inicial"\n' +
      '3. Toque em "Adicionar"\n\n' +
      '✅ O app aparecerá na sua tela inicial!'
    );
  };

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert('✅ App já está instalado!\n\nO Shopee Delivery já está na sua tela inicial.');
      return;
    }

    setIsInstalling(true);

    try {
      // Detectar iOS (incluindo Chrome no iOS)
      const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      
      // Debug no console
      console.log('🔍 Detectando plataforma:', {
        userAgent: navigator.userAgent,
        isiOS,
        hasShare: 'share' in navigator,
        isStandalone
      });

      if (isiOS && navigator.share) {
        try {
          console.log('🍎 iOS detectado com Share API - Abrindo share sheet...');
          
          // Abre o share sheet do iOS; "Adicionar à Tela de Início" fica lá dentro
          await navigator.share({ 
            title: 'Shopee Delivery Partners',
            url: location.href 
          });
          
          // Aguardar um pouco e verificar se foi instalado
          setTimeout(() => {
            const nowStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            if (nowStandalone) {
              setIsStandalone(true);
              alert('🎉 APP INSTALADO COM SUCESSO!\n\nO Shopee Delivery agora está na sua tela inicial!');
            } else {
              // Mostrar dica sobre onde encontrar a opção
              alert(
                '📱 SHARE SHEET ABERTO!\n\n' +
                'Procure por:\n' +
                '• "Adicionar à Tela de Início"\n' +
                '• "Add to Home Screen"\n\n' +
                'Role para baixo se não encontrar imediatamente.'
              );
            }
            setIsInstalling(false);
          }, 2000);
          
        } catch (error) {
          console.log('Share API falhou:', error);
          setIsInstalling(false);
          openHowTo();
        }
      } else {
        // Para Android ou outros navegadores, mostrar instruções
        setIsInstalling(false);
        openHowTo();
      }

    } catch (error) {
      console.error('Erro na instalação:', error);
      setIsInstalling(false);
      openHowTo();
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
          {isStandalone && (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-semibold">✅ App Já Instalado!</p>
              <p className="text-green-700 text-sm">
                O Shopee Delivery já está instalado na sua tela inicial
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
            disabled={isInstalling}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl text-lg"
          >
            {isInstalling ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Instalando...
              </>
            ) : isStandalone ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Já Instalado
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Instalar na Tela Inicial
              </>
            )}
          </Button>

          <Button
            onClick={openHowTo}
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
          {!isStandalone && (
            <p className="mt-2 text-orange-600 font-medium">
              💡 Dica: No iOS, procure "Adicionar à Tela de Início" no menu de compartilhamento
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallApp;