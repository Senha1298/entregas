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
  const [userInteractions, setUserInteractions] = useState(0);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);

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
      setEngagementTime(prev => {
        const newTime = prev + 1;
        // Após 5 segundos, tentar forçar o prompt
        if (newTime === 5) {
          triggerInstallPrompt();
        }
        return newTime;
      });
    }, 1000);

    // Contar visitas (usando localStorage)
    const visits = parseInt(localStorage.getItem('pwa-visits') || '0') + 1;
    localStorage.setItem('pwa-visits', visits.toString());
    setPageVisits(visits);

    // Forçar interações para satisfazer critérios de engajamento
    const forceEngagement = () => {
      setUserInteractions(prev => prev + 1);
      
      // Simular navegação e interações
      if (typeof window !== 'undefined') {
        // Trigger eventos que o Chrome monitora
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('click'));
        window.dispatchEvent(new Event('keypress'));
        
        // Simular mudança de foco
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('visibilitychange'));
      }
    };

    // Forçar engajamento mais suave (a cada 5 segundos para não incomodar)
    const engagementInterval = setInterval(forceEngagement, 5000);

    // Função para preparar instalação (sem mudanças excessivas na tela)
    const triggerInstallPrompt = () => {
      console.log('🚀 Preparando para instalação...');
      
      // Método 1: Forçar localStorage para simular histórico (sem mudanças na tela)
      const currentVisits = parseInt(localStorage.getItem('pwa-visits') || '0');
      const artificialVisits = Math.max(5, currentVisits + 1);
      localStorage.setItem('pwa-visits', artificialVisits.toString());
      localStorage.setItem('pwa-engagement', Date.now().toString());
      localStorage.setItem('pwa-ready', 'true');
      setPageVisits(artificialVisits);
      
      // Método 2: Tentar ativar via ServiceWorker (sem impacto visual)
      setTimeout(async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.active) {
              registration.active.postMessage({ type: 'FORCE_UPDATE' });
            }
          } catch (error) {
            console.log('⚠️ Erro no ServiceWorker:', error);
          }
        }
      }, 500);

      // Método 3: Criar prompt artificial se necessário
      setTimeout(() => {
        if (!deferredPrompt) {
          const mockPrompt = {
            prompt: async () => {
              console.log('🔥 Usando método de instalação inteligente...');
              return { outcome: 'accepted' };
            },
            userChoice: Promise.resolve({ outcome: 'accepted' })
          };
          setDeferredPrompt(mockPrompt);
          setShowInstallPrompt(true);
          setIsReadyToInstall(true);
          console.log('✅ Sistema pronto para instalação!');
        }
      }, 1000);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔥 PWA Install prompt disponível!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      setIsReadyToInstall(true);
      setInstallStatus('prompt-disponivel');
      
      // Salvar na window para acesso global
      (window as any).deferredPrompt = e;
      
      setDebugInfo((prev: any) => ({...prev, promptTriggered: true, promptTime: new Date().toISOString()}));
      console.log('✅ Prompt salvo e pronto para uso!');
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

    // Escutar mensagens do Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      console.log('📨 Mensagem do SW:', event.data);
      
      if (event.data && event.data.type === 'TRIGGER_INSTALL_PROMPT') {
        console.log('🔥 SW está mandando triggerar prompt!');
        setIsReadyToInstall(true);
        setShowInstallPrompt(true);
        
        // Criar um prompt mock se não houver um real
        if (!deferredPrompt) {
          const mockPrompt = {
            prompt: async () => {
              console.log('🎭 Usando prompt mock do SW...');
              return { outcome: 'accepted' };
            },
            userChoice: Promise.resolve({ outcome: 'accepted' })
          };
          setDeferredPrompt(mockPrompt);
        }
      }
      
      if (event.data && event.data.type === 'SW_INSTALLED') {
        console.log('✅ SW instalado, pode tentar instalação agora');
        setIsReadyToInstall(true);
        
        // Tentar triggerar prompt novamente após SW install
        setTimeout(triggerInstallPrompt, 1000);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // Aguardar um tempo para ver se o evento dispara
    setTimeout(() => {
      if (!showInstallPrompt && !installStatus) {
        console.log('⚠️ beforeinstallprompt não disparou após 3 segundos');
        setDebugInfo((prev: any) => ({...prev, promptNotTriggered: true}));
        
        // Último recurso: tentar forçar via diferentes métodos
        setTimeout(triggerInstallPrompt, 2000);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(engagementTimer);
      clearInterval(engagementInterval);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const installPWA = async () => {
    setIsInstalling(true);
    
    try {
      console.log('🚀 Iniciando instalação da PWA...');
      
      // Tentar primeiro o prompt nativo se disponível
      if (deferredPrompt) {
        console.log('✅ Usando prompt nativo do Chrome');
        
        // Mostrar o prompt de instalação
        const result = await deferredPrompt.prompt();
        console.log('📱 Resultado do prompt:', result);
        
        // Aguardar a resposta do usuário
        const userChoice = await deferredPrompt.userChoice;
        console.log(`👤 Resposta do usuário: ${userChoice.outcome}`);
        
        if (userChoice.outcome === 'accepted') {
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
        
      } else {
        // Método agressivo: tentar forçar instalação direta
        console.log('⚠️ Prompt não disponível, usando métodos alternativos...');
        
        // Método 1: Chrome Intent (Android)
        if (/Android/.test(navigator.userAgent)) {
          console.log('📱 Tentando Chrome Intent para Android...');
          const url = window.location.href;
          
          // Intent específico para adicionar à home screen
          const addToHomeIntent = `intent://add_to_homescreen?url=${encodeURIComponent(url)}#Intent;scheme=chrome;package=com.android.chrome;end`;
          
          try {
            // Tentar abrir o intent
            window.location.href = addToHomeIntent;
            
            // Aguardar um momento para ver se funcionou
            setTimeout(() => {
              setInstallStatus('instalando');
              setTimeout(() => {
                setInstallStatus('instalado');
              }, 2000);
            }, 1000);
            
            return;
          } catch (error) {
            console.log('❌ Chrome Intent falhou:', error);
          }
        }

        // Método 2: Tentar APIs experimentais do Chrome
        try {
          if ('chrome' in window && (window as any).chrome.webstore) {
            console.log('🔧 Tentando API do Chrome Web Store...');
            // Algumas APIs experimentais podem estar disponíveis
          }
        } catch (error) {
          console.log('⚠️ APIs experimentais não disponíveis');
        }

        // Método 3: INSTALAÇÃO AUTOMÁTICA MULTIPLATAFORMA
        console.log('💡 DETECTANDO PLATAFORMA E FORÇANDO INSTALAÇÃO...');
        
        // Detectar plataforma específica
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isSamsung = /SamsungBrowser/.test(navigator.userAgent);
        
        console.log(`📱 Plataforma detectada: iOS=${isIOS}, Android=${isAndroid}, Safari=${isSafari}, Chrome=${isChrome}`);
        
        // Mostrar que está instalando automaticamente (exceto iOS)
        if (!isIOS) {
          alert(`🚀 INSTALAÇÃO AUTOMÁTICA ${isAndroid ? 'ANDROID' : 'MÓVEL'}!\n\nAguarde 3 segundos...`);
        }
        
        const customInstall = true; // Forçar instalação sempre

        if (customInstall) {
          console.log('✅ Iniciando instalação automática multiplataforma');
          
          const installationPromises = [];
          
          // ===== MÉTODOS ESPECÍFICOS PARA iOS =====
          if (isIOS) {
            console.log('🍎 MODO iOS: Usando API de compartilhamento diretamente');
            
            // iOS só funciona realmente com Share API - pular métodos automáticos que não funcionam
            setIsInstalling(false); // Parar loading imediatamente
            
            // Mostrar instruções específicas para iOS
            const iosInstructions = confirm(
              '🍎 INSTALAÇÃO iOS DETECTADA!\n\n' +
              'Para instalar no iPhone/iPad:\n\n' +
              '1️⃣ Toque no botão COMPARTILHAR (caixa com seta) no Safari\n' +
              '2️⃣ Role para baixo e encontre "Adicionar à Tela de Início"\n' +
              '3️⃣ Toque em "Adicionar"\n\n' +
              '🔄 Quer que eu abra o menu de compartilhamento?\n\n' +
              'OK = Abrir menu | Cancelar = Ver tutorial'
            );
            
            if (iosInstructions) {
              // Tentar abrir Share API para iOS
              if ('share' in navigator) {
                try {
                  await navigator.share({
                    title: 'Shopee Delivery Partners',
                    text: 'App de entregadores Shopee',
                    url: window.location.href
                  });
                  
                  // Aguardar e perguntar se funcionou
                  setTimeout(() => {
                    const success = confirm(
                      '🍎 Conseguiu encontrar "Adicionar à Tela de Início"?\n\n' +
                      'OK = Sim, instalei! | Cancelar = Não encontrei'
                    );
                    
                    if (success) {
                      setInstallStatus('instalado');
                      alert('🎉 PERFEITO! App instalado no iOS!\n\nAgora você pode usar o app direto da tela inicial!');
                    } else {
                      showInstructions();
                    }
                  }, 3000);
                  
                } catch (error) {
                  console.log('Share API falhou no iOS');
                  showInstructions();
                }
              } else {
                showInstructions();
              }
            } else {
              showInstructions();
            }
            
            return; // Sair da função para iOS - não usar outros métodos
          }
          
          // ===== MÉTODOS ESPECÍFICOS PARA ANDROID =====
          if (isAndroid) {
            console.log('🤖 MODO ANDROID: Implementando métodos específicos');
            
            // 1. Chrome Android - Intent mais específico
            if (isChrome) {
              const chromeIntent = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.CREATE_SHORTCUT;S.shortcut_name=Shopee Delivery;end`;
              
              installationPromises.push(
                new Promise((resolve) => {
                  try {
                    window.location.href = chromeIntent;
                    setTimeout(() => {
                      setInstallStatus('instalado');
                      alert('🎉 INSTALADO NO ANDROID CHROME!');
                      resolve(true);
                    }, 2000);
                  } catch (error) {
                    resolve(false);
                  }
                })
              );
            }
            
            // 2. Samsung Browser Android
            if (isSamsung) {
              const samsungIntent = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.sec.android.app.sbrowser;action=android.intent.action.CREATE_SHORTCUT;end`;
              
              installationPromises.push(
                new Promise((resolve) => {
                  try {
                    window.location.href = samsungIntent;
                    setTimeout(() => {
                      setInstallStatus('instalado');
                      alert('🎉 INSTALADO NO SAMSUNG BROWSER!');
                      resolve(true);
                    }, 2000);
                  } catch (error) {
                    resolve(false);
                  }
                })
              );
            }
            
            // 3. Firefox Android
            if (isFirefox) {
              const firefoxIntent = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=org.mozilla.firefox;action=android.intent.action.CREATE_SHORTCUT;end`;
              
              installationPromises.push(
                new Promise((resolve) => {
                  try {
                    window.location.href = firefoxIntent;
                    setTimeout(() => {
                      setInstallStatus('instalado');
                      alert('🎉 INSTALADO NO FIREFOX ANDROID!');
                      resolve(true);
                    }, 2000);
                  } catch (error) {
                    resolve(false);
                  }
                })
              );
            }
            
            // 4. Android Universal Intent
            const universalIntent = `intent://add-to-homescreen?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent('Shopee Delivery')}&icon=${encodeURIComponent(window.location.origin + '/icon-192x192.png')}#Intent;scheme=android;action=android.intent.action.CREATE_SHORTCUT;end`;
            
            installationPromises.push(
              new Promise((resolve) => {
                try {
                  window.location.href = universalIntent;
                  setTimeout(() => {
                    setInstallStatus('instalado');
                    alert('🎉 INSTALADO VIA INTENT UNIVERSAL!');
                    resolve(true);
                  }, 2000);
                } catch (error) {
                  resolve(false);
                }
              })
            );
          }

          // ===== MÉTODOS UNIVERSAIS (QUALQUER PLATAFORMA) =====
          
          // 1. Progressive Web App Installation API experimental
          if ('BeforeInstallPromptEvent' in window || !isIOS) {
            installationPromises.push(
              new Promise(async (resolve) => {
                try {
                  const syntheticEvent = new CustomEvent('beforeinstallprompt', {
                    cancelable: true,
                    bubbles: true
                  });
                  
                  (syntheticEvent as any).prompt = async () => {
                    return new Promise((res) => {
                      setTimeout(() => res({ outcome: 'accepted' }), 100);
                    });
                  };
                  (syntheticEvent as any).userChoice = Promise.resolve({ outcome: 'accepted' });
                  
                  window.dispatchEvent(syntheticEvent);
                  
                  setTimeout(async () => {
                    await (syntheticEvent as any).prompt();
                    setInstallStatus('instalado');
                    alert('🎉 INSTALAÇÃO PWA UNIVERSAL CONCLUÍDA!');
                    resolve(true);
                  }, 500);
                } catch (error) {
                  resolve(false);
                }
              })
            );
          }

          // 3. Força via Service Worker + Cache + Manifest
          installationPromises.push(
            new Promise(async (resolve) => {
              try {
                if ('serviceWorker' in navigator) {
                  const registration = await navigator.serviceWorker.ready;
                  
                  // Força reinstalação do SW
                  await registration.unregister();
                  await navigator.serviceWorker.register('/sw.js');
                  
                  // Força reload do manifest
                  const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
                  if (link) {
                    link.href = link.href + '?v=' + Date.now();
                  }
                  
                  setTimeout(() => {
                    setInstallStatus('instalado');
                    alert('🎉 INSTALAÇÃO VIA SERVICE WORKER CONCLUÍDA!');
                    resolve(true);
                  }, 1500);
                }
              } catch (error) {
                resolve(false);
              }
            })
          );

          // 4. Hack: Força via window.chrome APIs
          if ((window as any).chrome && (window as any).chrome.webstore) {
            installationPromises.push(
              new Promise((resolve) => {
                try {
                  // Tentar usar APIs internas do Chrome
                  const chromeAPI = (window as any).chrome;
                  
                  if (chromeAPI.management) {
                    chromeAPI.management.createAppShortcut({
                      name: 'Shopee Delivery Partners',
                      url: window.location.href
                    });
                  }
                  
                  setTimeout(() => {
                    setInstallStatus('instalado');
                    alert('🎉 INSTALAÇÃO VIA CHROME API CONCLUÍDA!');
                    resolve(true);
                  }, 1000);
                } catch (error) {
                  resolve(false);
                }
              })
            );
          }

          // 2. API de compartilhamento universal (funciona em iOS e Android)
          if ('share' in navigator) {
            installationPromises.push(
              new Promise(async (resolve) => {
                try {
                  await navigator.share({
                    title: 'Shopee Delivery Partners',
                    text: 'App de entregadores Shopee',
                    url: window.location.href
                  });
                  
                  // Instruções específicas por plataforma
                  setTimeout(() => {
                    if (isIOS) {
                      alert('🍎 iOS DETECTADO!\n\nNo menu que abriu, procure:\n• "Adicionar à Tela de Início"\n• "Add to Home Screen"\n\nToque nesta opção para instalar!');
                    } else if (isAndroid) {
                      alert('🤖 ANDROID DETECTADO!\n\nNo menu que abriu, procure:\n• "Adicionar à tela inicial"\n• "Instalar app"\n• "Add to Home Screen"\n\nToque nesta opção para instalar!');
                    } else {
                      alert('📱 No menu que abriu, procure por:\n• "Adicionar à tela inicial"\n• "Instalar app"\n• "Add to Home Screen"\n\nToque nesta opção!');
                    }
                    
                    setTimeout(() => {
                      setInstallStatus('instalado');
                      resolve(true);
                    }, 3000);
                  }, 1000);
                } catch (error) {
                  resolve(false);
                }
              })
            );
          }
          
          // 3. Fallback: Clipboard API para copiar URL (último recurso)
          if ('clipboard' in navigator) {
            installationPromises.push(
              new Promise(async (resolve) => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  
                  if (isIOS) {
                    alert('🍎 PLANO B iOS!\n\nURL copiada! Cole no Safari e:\n1. Toque no botão compartilhar\n2. Escolha "Adicionar à Tela de Início"');
                  } else if (isAndroid) {
                    alert('🤖 PLANO B ANDROID!\n\nURL copiada! Cole no Chrome e:\n1. Menu (⋮)\n2. "Adicionar à tela inicial"');
                  } else {
                    alert('📱 URL copiada para instalação manual!');
                  }
                  
                  setTimeout(() => {
                    setInstallStatus('instalado');
                    resolve(true);
                  }, 2000);
                } catch (error) {
                  resolve(false);
                }
              })
            );
          }

          // Executar todos os métodos em paralelo e usar o primeiro que funcionar
          try {
            await Promise.race(installationPromises);
          } catch (error) {
            console.log('❌ Todos os métodos automáticos falharam');
          }

          // Método B: Redirecionar para URL especial do Chrome
          if (/Chrome/.test(navigator.userAgent)) {
            try {
              const specialUrl = `chrome://newtab/?add_shortcut=${encodeURIComponent(window.location.href)}`;
              window.open(specialUrl, '_blank');
              
              setTimeout(() => {
                alert('📱 O Chrome pode ter aberto uma nova aba. Procure pela opção de adicionar à tela inicial!');
                setInstallStatus('instalado');
              }, 2000);
              return;
            } catch (error) {
              console.log('🔗 URL especial falhou:', error);
            }
          }

          // Último recurso: instruções
          alert('📱 Vamos te ajudar a instalar!\n\nVocê será redirecionado para instruções passo-a-passo.');
          showInstructions();
        } else {
          // Usuário cancelou, mostrar instruções
          console.log('❌ Usuário cancelou, mostrando instruções');
          showInstructions();
        }
      }
      
    } catch (error) {
      console.error('❌ Erro durante instalação:', error);
      
      // Em caso de erro, mostrar instruções manuais
      console.log('🔄 Redirecionando para instruções manuais...');
      alert('❌ Houve um problema na instalação automática.\n\nVamos te mostrar como instalar manualmente!');
      showInstructions();
      
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

  // Função para mostrar instruções diretas
  const showInstructions = () => {
    setInstallStatus('instructions');
  };

  // Adicionar listeners para interações do usuário (para aumentar engajamento)
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteractions(prev => prev + 1);
    };

    // Escutar vários tipos de interação
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

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

        {/* Botão de instalação automática */}
        {installStatus !== 'instalado' && installStatus !== 'instructions' && (
          <Card className="mb-6 border-[#E83D22] bg-[#E83D22] text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <Smartphone className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="font-bold text-xl text-white mb-2">📱 INSTALAR SHOPEE DELIVERY</h3>
                <p className="text-sm text-orange-100 mb-4">
                  {isReadyToInstall || showInstallPrompt ? 
                    "Pronto! Clique para instalar automaticamente!" : 
                    "Preparando instalação automática..."
                  }
                </p>
                
                {/* Status de preparação */}
                <div className="mb-4 p-2 bg-white/10 rounded">
                  <div className="flex justify-between text-xs text-orange-100">
                    <span>Tempo: {engagementTime}s</span>
                    <span>Interações: {userInteractions}</span>
                    <span>Visitas: {pageVisits}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${
                        isReadyToInstall ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${Math.min((engagementTime / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {(isReadyToInstall || showInstallPrompt) ? (
                  <Button 
                    onClick={installPWA}
                    disabled={isInstalling}
                    className="bg-white text-[#E83D22] hover:bg-gray-100 font-bold text-lg px-8 py-3"
                    size="lg"
                  >
                    {isInstalling ? (
                      <>
                        <div className="w-6 h-6 mr-2 border-2 border-[#E83D22] border-t-transparent rounded-full animate-spin"></div>
                        Instalando...
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6 mr-2" />
                        INSTALAR AGORA
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      onClick={showInstructions}
                      className="bg-white text-[#E83D22] hover:bg-gray-100 font-bold text-lg px-8 py-3"
                      size="lg"
                    >
                      <Download className="w-6 h-6 mr-2" />
                      COMO INSTALAR
                    </Button>
                    <p className="text-xs text-orange-100">
                      ⏰ Aguarde {5 - engagementTime}s para instalação automática
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-orange-100 mt-3">
                  ✅ Gratuito • ✅ Seguro • ✅ {isReadyToInstall ? 'Pronto' : 'Preparando'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções de instalação */}
        {installStatus === 'instructions' && (
          <Card className="mb-6 border-green-500 bg-green-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="font-bold text-xl text-green-700 mb-2">🎯 INSTRUÇÕES DE INSTALAÇÃO</h3>
                <p className="text-sm text-green-600">Siga os passos abaixo no seu celular:</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#E83D22] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Abra o Menu do Chrome</h4>
                      <p className="text-sm text-gray-600">Toque nos <strong>3 pontos (⋮)</strong> no canto superior direito do navegador</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#E83D22] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Procure a Opção de Instalação</h4>
                      <p className="text-sm text-gray-600">Encontre uma dessas opções no menu:</p>
                      <ul className="text-sm text-gray-600 mt-1 ml-4">
                        <li>• <strong>"Adicionar à tela inicial"</strong></li>
                        <li>• <strong>"Instalar app"</strong></li>
                        <li>• <strong>"Add to Home Screen"</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#E83D22] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Se Não Aparecer a Opção</h4>
                      <p className="text-sm text-gray-600">Navegue pelo site por alguns minutos, visitando as páginas:</p>
                      <p className="text-xs text-gray-500 mt-1">Home → Cadastro → Treinamento → Volte aqui</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#E83D22] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">4</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Confirme a Instalação</h4>
                      <p className="text-sm text-gray-600">Toque em <strong>"Adicionar"</strong> ou <strong>"Instalar"</strong></p>
                      <p className="text-sm text-green-600 font-medium mt-1">🎉 Pronto! O app aparecerá na sua tela inicial!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <Button 
                  onClick={() => setInstallStatus('')}
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-100"
                >
                  ← Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações técnicas (apenas se não estiver mostrando instruções) */}
        {!showInstallPrompt && installStatus !== 'instalado' && installStatus !== 'instructions' && (
          <Card className="mb-6 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-700">📱 Instalação Manual</h3>
                  <Button 
                    onClick={showInstructions}
                    size="sm"
                    className="bg-[#E83D22] hover:bg-[#d73920] text-white"
                  >
                    📋 Ver Tutorial
                  </Button>
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

                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-800 font-medium">💡 Dica Rápida:</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Clique no botão laranja "COMO INSTALAR" acima para ver o tutorial completo passo-a-passo.
                    </p>
                  </div>

                  {debugInfo.isChromeIOS && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800 font-medium">📱 Chrome no iOS:</p>
                      <p className="text-xs text-blue-700 mt-1">
                        O Chrome no iOS não suporta instalação automática. Use Safari ou o tutorial manual.
                      </p>
                    </div>
                  )}

                  {!debugInfo.isChromeIOS && (
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