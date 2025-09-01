import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Smartphone, Download, Home, Share, Plus } from 'lucide-react';

const InstallApp = () => {
  const [step, setStep] = useState(1);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<string>('');

  // Detectar se o usuário pode instalar a PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔥 PWA Install prompt disponível!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Detectar se já está instalado
    const handleAppInstalled = () => {
      console.log('🎉 PWA foi instalada!');
      setInstallStatus('instalado');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar se já está rodando como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    
    if (isStandalone || isIOSStandalone) {
      setInstallStatus('instalado');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('❌ Prompt de instalação não disponível');
      return;
    }

    setIsInstalling(true);
    
    try {
      console.log('🚀 Iniciando instalação da PWA...');
      
      // Mostrar o prompt de instalação
      await deferredPrompt.prompt();
      
      // Aguardar a resposta do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`👤 Resposta do usuário: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallStatus('instalando');
        setTimeout(() => {
          setInstallStatus('instalado');
        }, 2000);
      } else {
        setInstallStatus('rejeitado');
      }
      
      // Limpar o prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
    } catch (error) {
      console.error('❌ Erro durante instalação:', error);
      setInstallStatus('erro');
    } finally {
      setIsInstalling(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Abra o Menu do Navegador",
      description: "Toque nos três pontos no canto superior direito do seu navegador",
      icon: "⋮",
      details: "Procure pelo ícone com três pontos verticais ou três linhas horizontais no seu navegador Chrome, Firefox ou Samsung Internet."
    },
    {
      id: 2,
      title: "Adicionar à Tela Inicial",
      description: "Encontre e toque na opção 'Adicionar à tela inicial' ou 'Instalar app'",
      icon: <Plus className="w-6 h-6" />,
      details: "Dependendo do seu navegador, essa opção pode aparecer como 'Adicionar à tela inicial', 'Instalar app' ou 'Add to Home Screen'."
    },
    {
      id: 3,
      title: "Confirmar Instalação",
      description: "Toque em 'Adicionar' para confirmar a instalação",
      icon: <Download className="w-6 h-6" />,
      details: "O aplicativo da Shopee Delivery será adicionado à sua tela inicial e poderá ser usado como um app nativo."
    },
    {
      id: 4,
      title: "Pronto! Use como App",
      description: "Agora você pode abrir o app diretamente da tela inicial",
      icon: <Home className="w-6 h-6" />,
      details: "O ícone da Shopee Delivery aparecerá na sua tela inicial. Toque nele para abrir o app em tela cheia, sem barra de endereços."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Smartphone className="w-16 h-16 text-[#E83D22] mx-auto mb-2" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Instale o App Shopee Delivery
          </h1>
          <p className="text-gray-600">
            Adicione nosso site à tela inicial do seu celular e use como um aplicativo nativo!
          </p>
        </div>

        {/* Status da Instalação */}
        {installStatus === 'instalado' && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center text-center">
                <div>
                  <h3 className="font-semibold text-green-700 mb-1">✅ App Já Instalado!</h3>
                  <p className="text-sm text-green-600">O Shopee Delivery já está instalado na sua tela inicial</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de instalação automática (se disponível) */}
        {showInstallPrompt && installStatus !== 'instalado' && (
          <Card className="mb-6 border-[#E83D22] bg-orange-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#E83D22] mb-1">🚀 Instalação com Um Clique</h3>
                  <p className="text-sm text-gray-600">Adicione o app à tela inicial instantaneamente!</p>
                  {installStatus === 'instalando' && (
                    <p className="text-xs text-blue-600 mt-1">⏳ Instalando...</p>
                  )}
                  {installStatus === 'rejeitado' && (
                    <p className="text-xs text-yellow-600 mt-1">ℹ️ Instalação cancelada pelo usuário</p>
                  )}
                  {installStatus === 'erro' && (
                    <p className="text-xs text-red-600 mt-1">❌ Erro na instalação. Tente novamente.</p>
                  )}
                </div>
                <Button 
                  onClick={installPWA} 
                  disabled={isInstalling || installStatus === 'instalado'}
                  className="bg-[#E83D22] hover:bg-[#d73920] disabled:opacity-50"
                  size="lg"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Instalando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Instalar Agora
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback para quando o prompt não está disponível */}
        {!showInstallPrompt && installStatus !== 'instalado' && (
          <Card className="mb-6 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-700 mb-1">📱 Instalação Manual</h3>
                <p className="text-sm text-blue-600 mb-3">
                  Use o tutorial abaixo para adicionar o app à sua tela inicial
                </p>
                <p className="text-xs text-gray-500">
                  O botão automático aparece apenas em navegadores compatíveis como Chrome e Edge
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial passo a passo */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Tutorial Passo a Passo
          </h2>
          
          {steps.map((stepItem, index) => (
            <Card 
              key={stepItem.id}
              className={`transition-all duration-300 cursor-pointer hover:shadow-md ${
                step === stepItem.id ? 'ring-2 ring-[#E83D22] bg-orange-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setStep(stepItem.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step === stepItem.id ? 'bg-[#E83D22] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {typeof stepItem.icon === 'string' ? (
                        <span className="text-lg font-bold">{stepItem.icon}</span>
                      ) : (
                        stepItem.icon
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        Passo {stepItem.id}: {stepItem.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {stepItem.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    step === stepItem.id ? 'rotate-90 text-[#E83D22]' : 'text-gray-400'
                  }`} />
                </div>
              </CardHeader>
              
              {step === stepItem.id && (
                <CardContent className="pt-0">
                  <div className="ml-13 pl-3 border-l-2 border-orange-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {stepItem.details}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Benefícios */}
        <Card className="mt-8 bg-gradient-to-r from-[#E83D22] to-[#FF6B35] text-white">
          <CardHeader>
            <CardTitle className="text-center text-white">Vantagens do App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Acesso mais rápido</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Funciona offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Notificações push</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Experiência nativa</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de voltar */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="border-[#E83D22] text-[#E83D22] hover:bg-[#E83D22] hover:text-white"
          >
            Voltar ao Site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;