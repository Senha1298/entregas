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
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showDebug, setShowDebug] = useState(false);
  const [engagementTime, setEngagementTime] = useState(0);
  const [pageVisits, setPageVisits] = useState(0);

  // Detectar condições PWA e debugar
  useEffect(() => {
    const checkPWAConditions = async () => {
      // Melhor detecção de Chrome mobile e desktop
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
      const isChromeDesktop = isChrome && !/Android|iPhone|iPad|iPod|Mobile/.test(userAgent);
      const isChromeMobile = isChrome && /Android/.test(userAgent);
      const isChromeIOS = /CriOS/.test(userAgent); // Chrome no iOS
      const isAnyChromeVariant = isChrome || isChromeIOS;

      const debug: any = {
        userAgent: userAgent,
        isChrome: isAnyChromeVariant,
        isChromeDesktop: isChromeDesktop,
        isChromeMobile: isChromeMobile,
        isChromeIOS: isChromeIOS,
        isAndroid: /Android/.test(userAgent),
        isIOS: /iPhone|iPad|iPod/.test(userAgent),
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        isIOSStandalone: (window.navigator as any).standalone,
        hasServiceWorker: 'serviceWorker' in navigator,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        timestamp: new Date().toISOString()
      };

      // Verificar Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          debug.serviceWorkerRegistered = !!registration;
          debug.serviceWorkerState = registration?.active?.state;
        } catch (error) {
          debug.serviceWorkerError = (error as Error).message;
        }
      }

      // Verificar manifest
      try {
        const manifestElement = document.querySelector('link[rel="manifest"]');
        debug.hasManifestLink = !!manifestElement;
        debug.manifestHref = manifestElement?.getAttribute('href');
      } catch (error) {
        debug.manifestError = (error as Error).message;
      }

      setDebugInfo(debug);
      console.log('🔍 PWA Debug Info:', debug);

      // Verificar se já está instalado
      if (debug.isStandalone || debug.isIOSStandalone) {
        setInstallStatus('instalado');
      }
    };

    checkPWAConditions();

    // Contar tempo de engajamento
    const engagementTimer = setInterval(() => {
      setEngagementTime(prev => prev + 1);
    }, 1000);

    // Contar visitas (usando localStorage)
    const visits = parseInt(localStorage.getItem('pwa-visits') || '0') + 1;
    localStorage.setItem('pwa-visits', visits.toString());
    setPageVisits(visits);

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔥 PWA Install prompt disponível!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      setDebugInfo((prev: any) => ({...prev, promptTriggered: true, promptTime: new Date().toISOString()}));
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

    // Aguardar um tempo para ver se o evento dispara
    setTimeout(() => {
      if (!showInstallPrompt && !installStatus) {
        console.log('⚠️ beforeinstallprompt não disparou após 3 segundos');
        setDebugInfo((prev: any) => ({...prev, promptNotTriggered: true}));
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(engagementTimer);
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

  // Função para tentar múltiplos métodos de instalação
  const forceInstallPrompt = async () => {
    console.log('🔥 Tentando forçar instalação...');
    
    // Método 1: Tentar usar o prompt diferido se existir
    if (deferredPrompt) {
      try {
        await installPWA();
        return;
      } catch (error) {
        console.log('❌ Prompt diferido falhou:', error);
      }
    }

    // Método 2: Tentar disparar o evento beforeinstallprompt manualmente
    try {
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      window.dispatchEvent(beforeInstallPromptEvent);
      
      setTimeout(() => {
        if (!showInstallPrompt) {
          console.log('⚠️ Evento manual não funcionou');
          setInstallStatus('manual');
        }
      }, 1000);
    } catch (error) {
      console.log('❌ Evento manual falhou:', error);
      setInstallStatus('manual');
    }

    // Método 3: Abrir diretamente o menu do Chrome (se possível)
    try {
      // Tentar usar APIs específicas do Android/Chrome
      if ((window as any).chrome && (window as any).chrome.app) {
        (window as any).chrome.app.installState((state: string) => {
          if (state === 'not_installed') {
            console.log('🚀 App não instalado, tentando instalar...');
            setInstallStatus('manual');
          }
        });
      } else {
        setInstallStatus('manual');
      }
    } catch (error) {
      console.log('❌ API Chrome falhou:', error);
      setInstallStatus('manual');
    }
  };

  // Função para simular instalação direta
  const directInstall = () => {
    // Abrir uma nova aba com instruções específicas
    const instructions = `
🚀 INSTALAR SHOPEE DELIVERY - MÉTODO DIRETO

1️⃣ NO SEU CHROME MOBILE:
   • Toque nos 3 pontos (⋮) no canto superior direito
   
2️⃣ PROCURE A OPÇÃO:
   • "Adicionar à tela inicial" 
   • "Instalar app"
   • "Add to Home Screen"
   
3️⃣ SE NÃO APARECER:
   • Navegue pelo site por 2-3 minutos
   • Visite: Home → Cadastro → Treinamento
   • Volte aos 3 pontos do Chrome
   
4️⃣ CONFIRME:
   • Toque em "Adicionar" ou "Instalar"
   • O app aparecerá na sua tela inicial!

⚡ DICA: Feche esta aba e use as instruções acima
    `;
    
    alert(instructions);
    setInstallStatus('instructions');
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

        {/* Botão de instalação direta sempre visível para Chrome */}
        {debugInfo.isChrome && !showInstallPrompt && installStatus !== 'instalado' && (
          <Card className="mb-6 border-[#E83D22] bg-[#E83D22] text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-white mb-2">📱 INSTALAR SHOPEE DELIVERY</h3>
                <p className="text-sm text-orange-100 mb-4">
                  Adicione nosso app à sua tela inicial agora!
                </p>
                <Button 
                  onClick={directInstall}
                  className="bg-white text-[#E83D22] hover:bg-gray-100 font-semibold"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  INSTALAR NA TELA INICIAL
                </Button>
                <p className="text-xs text-orange-100 mt-2">
                  Clique para ver instruções passo-a-passo
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback para quando o prompt não está disponível */}
        {!showInstallPrompt && installStatus !== 'instalado' && (
          <Card className="mb-6 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-700">📱 Instalação Manual</h3>
                  {debugInfo.isChrome && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={forceInstallPrompt}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Ativar Botão
                      </Button>
                      <Button 
                        onClick={directInstall}
                        size="sm"
                        className="bg-[#E83D22] hover:bg-[#d73920] text-white"
                      >
                        Instalar Direto
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Status de engajamento */}
                <div className="mb-3 p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">Status de Engajamento:</p>
                  <div className="flex justify-between text-xs">
                    <span>Tempo na página: {engagementTime}s</span>
                    <span>Visitas: {pageVisits}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${engagementTime >= 30 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min((engagementTime / 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {engagementTime >= 30 ? '✅ Tempo suficiente!' : `⏰ ${30 - engagementTime}s restantes`}
                  </p>
                </div>

                <p className="text-sm text-blue-600 mb-3">
                  Use o tutorial abaixo para adicionar o app à sua tela inicial
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  O botão automático aparece apenas em navegadores compatíveis como Chrome e Edge
                </p>
                
                {/* Informações de diagnóstico */}
                <div className="text-left bg-white p-3 rounded border text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Diagnóstico:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowDebug(!showDebug)}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    >
                      {showDebug ? 'Ocultar' : 'Ver detalhes'}
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Navegador:</span>
                      <span className={debugInfo.isChrome ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.isChrome ? (
                          debugInfo.isChromeMobile ? '✅ Chrome Mobile' :
                          debugInfo.isChromeIOS ? '✅ Chrome iOS' :
                          debugInfo.isChromeDesktop ? '✅ Chrome Desktop' : '✅ Chrome'
                        ) : '❌ Não Chrome'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>HTTPS:</span>
                      <span className={debugInfo.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.isSecureContext ? '✅ Seguro' : '❌ Inseguro'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Worker:</span>
                      <span className={debugInfo.serviceWorkerRegistered ? 'text-green-600' : 'text-yellow-600'}>
                        {debugInfo.serviceWorkerRegistered ? '✅ Ativo' : '⏳ Carregando'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Manifest:</span>
                      <span className={debugInfo.hasManifestLink ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.hasManifestLink ? '✅ OK' : '❌ Erro'}
                      </span>
                    </div>
                  </div>

                  {/* Instruções específicas para ativar o prompt automático */}
                  {debugInfo.isChrome && installStatus !== 'manual' ? (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800 font-medium">🎯 Como ativar o botão automático:</p>
                      <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                        <li>• ✅ Permaneça na página por 30+ segundos</li>
                        <li>• 🔗 Visite as páginas: / → /cadastro → /treinamento</li>
                        <li>• ⏰ Aguarde 2-3 minutos navegando</li>
                        <li>• 🔄 Volte para /instalar-app</li>
                        <li>• 🚀 O botão "Instalar Agora" deve aparecer!</li>
                      </ul>
                    </div>
                  ) : installStatus === 'manual' ? (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-xs text-orange-800 font-medium">📲 Chrome Menu Method:</p>
                      <ol className="text-xs text-orange-700 mt-1 space-y-1">
                        <li>1. Toque nos 3 pontos (⋮) no canto superior do Chrome</li>
                        <li>2. Procure "Adicionar à tela inicial" ou "Instalar app"</li>
                        <li>3. Se não aparecer, navegue mais pelo site e tente novamente</li>
                      </ol>
                      <div className="mt-2 text-center">
                        <Button 
                          onClick={directInstall}
                          size="sm"
                          className="bg-[#E83D22] hover:bg-[#d73920] text-white"
                        >
                          📋 Ver Instruções Completas
                        </Button>
                      </div>
                    </div>
                  ) : installStatus === 'instructions' ? (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-800 font-medium">✅ Instruções enviadas!</p>
                      <p className="text-xs text-green-700 mt-1">
                        Siga as instruções na mensagem que apareceu. Use os 3 pontos do Chrome para adicionar à tela inicial.
                      </p>
                      <div className="mt-2 text-center">
                        <Button 
                          onClick={directInstall}
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          📋 Ver Novamente
                        </Button>
                      </div>
                    </div>
                  ) : debugInfo.isChromeIOS ? (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800 font-medium">📱 Chrome no iOS:</p>
                      <p className="text-xs text-blue-700 mt-1">
                        O Chrome no iOS não suporta instalação automática. Use Safari ou o tutorial manual.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs text-gray-800 font-medium">🌐 Seu navegador:</p>
                      <p className="text-xs text-gray-700 mt-1">
                        Para instalação automática, use Chrome (Android) ou Edge. Ou siga o tutorial manual abaixo.
                      </p>
                    </div>
                  )}

                  {showDebug && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-600">
                        <strong>Detalhes técnicos:</strong>
                        <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
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