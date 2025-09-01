import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Smartphone, Download, Home, Share, Plus } from 'lucide-react';

const InstallApp = () => {
  const [step, setStep] = useState(1);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Detectar se o usuário pode instalar a PWA
  useEffect(() => {
    let deferredPrompt: any = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      (window as any).deferredPrompt = null;
      setShowInstallPrompt(false);
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

        {/* Botão de instalação automática (se disponível) */}
        {showInstallPrompt && (
          <Card className="mb-6 border-[#E83D22] bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#E83D22] mb-1">Instalação Rápida</h3>
                  <p className="text-sm text-gray-600">Instale o app com um clique!</p>
                </div>
                <Button onClick={installPWA} className="bg-[#E83D22] hover:bg-[#d73920]">
                  <Download className="w-4 h-4 mr-2" />
                  Instalar App
                </Button>
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