import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

export default function AppPage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showPage = (page: string) => {
    setCurrentPage(page);
  };

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalVisible(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalVisible(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalVisible && e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalVisible]);

  useEffect(() => {
    // Aplicar estilos ao body quando o componente montar
    document.body.className = 'bg-[#fafbfc] min-h-screen flex flex-col justify-between sora relative';
    document.body.style.maxWidth = '430px';
    document.body.style.margin = '0 auto';
    document.body.style.boxShadow = '0 0 24px 0 rgba(0,0,0,0.08)';
    document.body.style.height = '100vh';
    
    return () => {
      // Limpar estilos quando o componente desmontar
      document.body.className = '';
      document.body.style.maxWidth = '';
      document.body.style.margin = '';
      document.body.style.boxShadow = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Shopee Treinamento</title>
        <meta name="viewport" content="width=375, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
        <style>{`
          body, .sora {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          }
          .btn-treinamento:focus-visible {
            outline: 2px solid #f55a1e;
            outline-offset: 2px;
          }
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          html, body {
            background: #fafbfc;
            overscroll-behavior-y: none;
            min-height: 100vh;
            height: 100%;
          }
          @media (max-width: 430px) {
            body {
              padding-bottom: env(safe-area-inset-bottom);
              padding-top: env(safe-area-inset-top);
            }
          }
          .modal-bg {
            background: rgba(0,0,0,0.25);
            backdrop-filter: blur(2px);
          }
          /* Força todas as bordas arredondadas para 8px */
          .rounded-2xl, .rounded-xl, .rounded-lg, .rounded-t-2xl, .rounded-b-2xl, .rounded, .rounded-t-lg, .rounded-b-lg, .rounded-t, .rounded-b, .rounded-md, .rounded-sm {
            border-radius: 8px !important;
          }
          .btn-treinamento img, .btn-treinamento .rounded-t-2xl {
            border-radius: 8px 8px 0 0 !important;
          }
          .btn-treinamento {
            border-radius: 8px !important;
          }
          /* Custom 2px border radius for specific elements */
          .rounded-0 {
            border-radius: 2px !important;
          }
        `}</style>
      </Helmet>
      <div className="bg-[#fafbfc] min-h-screen flex flex-col justify-between sora relative" style={{maxWidth:'430px',margin:'0 auto',boxShadow:'0 0 24px 0 rgba(0,0,0,0.08)',height:'100vh'}}>
        {/* Header */}
        <div className="bg-[#f55a1e] w-full h-[48px] fixed top-0 left-0 flex items-center justify-between px-4 z-30 sora" style={{maxWidth:'430px'}}>
          <div className="flex items-center">
            <div className="w-[36px] h-[36px] flex items-center justify-center">
              <img alt="Shopee logo icon, white bag with orange S on orange background" className="w-7 h-7" height="28" src="https://freelogopng.com/images/all_img/1656181355shopee-icon-white.png" width="28" />
            </div>
          </div>
          <div>
            <button aria-label="Abrir notificações" className="relative focus:outline-none" onClick={openModal}>
              <i className="fas fa-bell text-white text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-white text-[#f55a1e] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-[#f55a1e]" style={{padding:0}}>
                1
              </span>
            </button>
          </div>
        </div>

        {/* Modal Notificações */}
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isModalVisible ? '' : 'hidden'}`}>
          <div className="modal-bg absolute inset-0" onClick={closeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-[92%] max-w-[370px] mx-auto p-0 overflow-hidden z-10 border border-[#f3f4f6]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#f55a1e] rounded-t-2xl">
              <span className="text-white text-lg font-bold sora">Notificações</span>
              <button aria-label="Fechar notificações" className="text-white text-2xl focus:outline-none" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
                  <i aria-hidden="true" className="fas fa-exclamation-triangle text-[#f55a1e] text-2xl"></i>
                </div>
                <div>
                  <div className="font-bold text-[#f55a1e] mb-1 sora">Treinamento obrigatório pendente</div>
                  <div className="text-sm mb-1" style={{color: '#000000cc'}}>Você ainda não realizou o treinamento obrigatório para entregadores. Acesse o treinamento para continuar utilizando a plataforma.</div>
                  <div className="text-xs" style={{color: '#00000066'}}>Agora mesmo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col items-center pt-[48px] pb-[70px] sora overflow-y-auto" style={{maxWidth:'430px'}}>
          {/* Home Page Content */}
          <div className={`w-full ${currentPage === 'home' ? '' : 'hidden'}`}>
            {/* Alert Card */}
            <div className="w-[94%] max-w-[400px] bg-gradient-to-br from-[#f55a1e] to-[#ff7e3e] rounded-2xl p-0 mb-6 mt-4 flex justify-center items-center mx-auto shadow-lg border border-[#ff7e3e]/20">
              <img alt="Banner de treinamento obrigatório Shopee, com ícone de alerta e texto em português sobre o treinamento para entregadores" className="w-full object-cover rounded-2xl" src="https://ppyxcanzwxsbsrokvpky.supabase.co/storage/v1/object/public/app-assets/apps/banners/1756753623789-1jp3dstfhyf.png" style={{maxHeight: '200px'}} />
            </div>
            {/* Square Card Aligned Left with Button Effect and Shadow */}
            <div className="w-full flex justify-start pl-4">
              <button aria-label="Acessar treinamento" className="btn-treinamento w-[170px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col sora transition transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#f55a1e] active:scale-95 border border-[#f3f4f6]" style={{border:'none', padding:0}} type="button">
                <div className="relative">
                  <img alt="Banner quadrado Shopee treinamento, ilustração de entregador e texto em português" className="w-full h-[170px] object-cover rounded-t-2xl select-none pointer-events-none transition-shadow duration-200 hover:shadow-xl" draggable="false" src="https://i.ibb.co/nMfSpcM1/assets-task-01k43b21e2eqrszdavwvt81vf6-1756753987-img-0.webp" />
                  <span className="absolute top-2 right-2 bg-white/80 text-[#f55a1e] text-xs font-bold px-2 py-0.5 rounded-full shadow">Novo</span>
                </div>
                <div className="bg-[#FB4903] text-white text-center py-3 text-base font-bold sora transition-colors duration-150 hover:bg-[#e04e1a] shadow-md tracking-wide">
                  ACESSAR TREINAMENTO
                </div>
              </button>
            </div>
            {/* Quick Actions */}
            <div className="w-full max-w-[400px] mx-auto mt-8 flex justify-between px-4">
              <div className="flex flex-col items-center">
                <button className="bg-white rounded-0 shadow-lg w-14 h-14 flex items-center justify-center border border-[#f3f4f6] hover:bg-[#fff5f0] transition">
                  <i className="fas fa-book-open text-[#f55a1e] text-2xl"></i>
                </button>
                <span className="text-xs mt-2 font-medium" style={{color: '#000000cc'}}>Meus Cursos</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="bg-white rounded-0 shadow-lg w-14 h-14 flex items-center justify-center border border-[#f3f4f6] hover:bg-[#fff5f0] transition">
                  <i className="fas fa-question-circle text-[#f55a1e] text-2xl"></i>
                </button>
                <span className="text-xs mt-2 font-medium" style={{color: '#000000cc'}}>Ajuda</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="bg-white rounded-0 shadow-lg w-14 h-14 flex items-center justify-center border border-[#f3f4f6] hover:bg-[#fff5f0] transition">
                  <i className="fas fa-user text-[#f55a1e] text-2xl"></i>
                </button>
                <span className="text-xs mt-2 font-medium" style={{color: '#000000cc'}}>Perfil</span>
              </div>
            </div>
            {/* Section: Dicas rápidas */}
            <div className="w-full max-w-[400px] mx-auto mt-8 px-4">
              <h3 className="text-lg font-bold mb-2 text-[#f55a1e]">Dicas rápidas</h3>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                <div className="min-w-[140px] bg-white rounded-xl shadow p-3 flex flex-col items-center border border-[#f3f4f6]">
                  <img alt="Ícone de capacete de entregador laranja, estilo flat" className="w-12 h-12 mb-2" height="60" src="https://replicate.delivery/xezq/hBdOeikZxKRwACiuv9x9uvAKuL7el2ENE6kqK1xuNMS9zfhqA/out-0.png" width="60" />
                  <span className="text-xs text-center" style={{color: '#000000cc'}}>Use sempre o capacete</span>
                </div>
                <div className="min-w-[140px] bg-white rounded-xl shadow p-3 flex flex-col items-center border border-[#f3f4f6]">
                  <img alt="Ícone de caixa de entrega laranja, estilo flat" className="w-12 h-12 mb-2" height="60" src="https://replicate.delivery/xezq/MVJaO2VEMNLgOZDGa2xjXjYF7nrjMCICHScVZGb9U5HfezfhqA/out-0.png" width="60" />
                  <span className="text-xs text-center" style={{color: '#000000cc'}}>Conferir o pacote antes de sair</span>
                </div>
                <div className="min-w-[140px] bg-white rounded-xl shadow p-3 flex flex-col items-center border border-[#f3f4f6]">
                  <img alt="Ícone de smartphone com mapa, estilo flat" className="w-12 h-12 mb-2" height="60" src="https://replicate.delivery/xezq/C4e7QRJqkq3kNq0v5GjCcWm6vLBuIvQrcCOqZBfjkBY9zfhqA/out-0.png" width="60" />
                  <span className="text-xs text-center" style={{color: '#000000cc'}}>Acompanhe o trajeto pelo app</span>
                </div>
              </div>
            </div>
          </div>

          {/* Entregas Page Content */}
          <div className={`w-full ${currentPage === 'entregas' ? '' : 'hidden'}`}>
            <h2 className="text-2xl font-bold text-center my-6 sora text-[#f55a1e]">Entregas Disponíveis</h2>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow-lg border border-[#f3f4f6]">
              <div className="mb-2">
                <h3 className="font-bold sora text-[#f55a1e]">Rota Centro (São Paulo)</h3>
              </div>
              <p className="text-sm" style={{color: '#000000cc'}}>
                Entregas disponíveis: <span className="font-bold">54</span><br />
                Ganho total: <span className="font-bold">R$ 648,00</span>
              </p>
              <button className="mt-4 w-full bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 rounded-0 shadow transition sora text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#f55a1e]">
                <i className="fas fa-box"></i>
                Realizar entregas
              </button>
            </div>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow-lg border border-[#f3f4f6]">
              <div className="mb-2">
                <h3 className="font-bold sora text-[#f55a1e]">Rota Zona Sul (São Paulo)</h3>
              </div>
              <p className="text-sm" style={{color: '#000000cc'}}>
                Entregas disponíveis: <span className="font-bold">68</span><br />
                Ganho total: <span className="font-bold">R$ 816,00</span>
              </p>
              <button className="mt-4 w-full bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 rounded-0 shadow transition sora text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#f55a1e]">
                <i className="fas fa-box"></i>
                Realizar entregas
              </button>
            </div>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow-lg border border-[#f3f4f6]">
              <div className="mb-2">
                <h3 className="font-bold sora text-[#f55a1e]">Rota Leste (São Paulo)</h3>
              </div>
              <p className="text-sm" style={{color: '#000000cc'}}>
                Entregas disponíveis: <span className="font-bold">42</span><br />
                Ganho total: <span className="font-bold">R$ 504,00</span>
              </p>
              <button className="mt-4 w-full bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 rounded-0 shadow transition sora text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#f55a1e]">
                <i className="fas fa-box"></i>
                Realizar entregas
              </button>
            </div>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow-lg border border-[#f3f4f6]">
              <div className="mb-2">
                <h3 className="font-bold sora text-[#f55a1e]">Rota Norte (São Paulo)</h3>
              </div>
              <p className="text-sm" style={{color: '#000000cc'}}>
                Entregas disponíveis: <span className="font-bold">85</span><br />
                Ganho total: <span className="font-bold">R$ 1.020,00</span>
              </p>
              <button className="mt-4 w-full bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 rounded-0 shadow transition sora text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#f55a1e]">
                <i className="fas fa-box"></i>
                Realizar entregas
              </button>
            </div>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-4 mb-4 mx-auto shadow-lg border border-[#f3f4f6]">
              <div className="mb-2">
                <h3 className="font-bold sora text-[#f55a1e]">Rota Oeste (São Paulo)</h3>
              </div>
              <p className="text-sm" style={{color: '#000000cc'}}>
                Entregas disponíveis: <span className="font-bold">61</span><br />
                Ganho total: <span className="font-bold">R$ 732,00</span>
              </p>
              <button className="mt-4 w-full bg-[#f55a1e] hover:bg-[#e04e1a] text-white font-bold py-2 rounded-0 shadow transition sora text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#f55a1e]">
                <i className="fas fa-box"></i>
                Realizar entregas
              </button>
            </div>
          </div>

          {/* Saldo Page Content */}
          <div className={`w-full ${currentPage === 'saldo' ? '' : 'hidden'}`}>
            <div className="w-[94%] max-w-[400px] bg-white rounded-2xl p-6 mb-4 mx-auto shadow-lg mt-8 sora flex flex-col items-center border border-[#f3f4f6]">
              <h2 className="text-2xl font-bold mb-4 sora text-center text-[#f55a1e]">Saldo disponível</h2>
              <div className="flex items-center justify-center mb-6">
                <i className="fas fa-wallet text-[#f55a1e] text-3xl mr-3"></i>
                <span className="text-3xl font-bold sora" style={{color: '#000000cc'}}>R$ 0,00</span>
              </div>
              <button aria-disabled="true" className="bg-gray-300 text-gray-500 font-bold py-3 px-8 rounded-0 cursor-not-allowed text-lg sora shadow-md opacity-70" disabled type="button">
                Realizar saque
              </button>
              <div className="w-full mt-8">
                <h3 className="text-base font-bold text-[#f55a1e] mb-2">Histórico de transações</h3>
                <ul className="divide-y divide-gray-100">
                  <li className="flex justify-between py-2">
                    <span style={{color: '#000000cc'}}>Entrega #12345</span>
                    <span style={{color: '#00000066'}}>R$ 0,00</span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span style={{color: '#000000cc'}}>Entrega #12344</span>
                    <span style={{color: '#00000066'}}>R$ 0,00</span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span style={{color: '#000000cc'}}>Entrega #12343</span>
                    <span style={{color: '#00000066'}}>R$ 0,00</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full bg-white flex justify-between items-center h-[70px] z-30 sora" style={{maxWidth:'430px'}}>
          <div className="flex-1 flex flex-col items-center py-2 cursor-pointer sora transition" onClick={() => showPage('home')}>
            <i className={`fas fa-home text-[#f55a1e] text-2xl ${currentPage !== 'home' ? 'opacity-40' : ''}`}></i>
            <span className={`text-[#f55a1e] text-base font-medium mt-1 sora ${currentPage !== 'home' ? 'opacity-40' : ''}`}>Início</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2 cursor-pointer sora transition" onClick={() => showPage('entregas')}>
            <i className={`fas fa-box text-[#f55a1e] text-2xl ${currentPage !== 'entregas' ? 'opacity-40' : ''}`}></i>
            <span className={`text-[#f55a1e] text-base font-medium mt-1 sora ${currentPage !== 'entregas' ? 'opacity-40' : ''}`}>Entregas</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2 cursor-pointer sora transition" onClick={() => showPage('saldo')}>
            <i className={`fas fa-wallet text-[#f55a1e] text-2xl ${currentPage !== 'saldo' ? 'opacity-40' : ''}`}></i>
            <span className={`text-[#f55a1e] text-base font-medium mt-1 sora ${currentPage !== 'saldo' ? 'opacity-40' : ''}`}>Saldo</span>
          </div>
        </div>
      </div>
    </>
  );
}