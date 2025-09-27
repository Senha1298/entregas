import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import kitEpiImage from '../assets/kit-epi-new.webp';
import pixLogo from '../assets/pix-logo.png';

interface PixInfo {
  pixCode: string;
  pixQRCode: string;
  transactionId: string;
  amount: number;
  expiresAt: string;
}

interface DadosUsuario {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estado: string;
  cidade: string;
  endereco: string;
  veiculoTipo: string;
  veiculoPlaca: string;
}

export default function Pagamento() {
  const [, setLocation] = useLocation();
  const [match] = useRoute('/pagamento/:transactionId?');
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [pixInfo, setPixInfo] = useState<PixInfo | null>(null);
  const [dadosUsuario, setDadosUsuario] = useState<DadosUsuario | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos em segundos
  const [statusChecking, setStatusChecking] = useState(false);

  // Buscar dados do localStorage
  useEffect(() => {
    const dados = localStorage.getItem('dadosEntregador');
    if (dados) {
      setDadosUsuario(JSON.parse(dados));
    } else {
      // Se não há dados, redirecionar para o cadastro
      setLocation('/entrega');
    }

    // Se temos transactionId na URL, buscar dados do PIX
    if (match && typeof match === 'object' && 'params' in match) {
      const transactionId = match.params.transactionId;
      if (transactionId) {
        buscarDadosTransacao(transactionId);
      } else {
        // Se não tem transactionId, redirecionar para entrega
        setLocation('/entrega');
      }
    } else {
      setLocation('/entrega');
    }
  }, [match]);

  // Timer para contagem regressiva
  useEffect(() => {
    if (pixInfo && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            toast({
              title: "PIX Expirado",
              description: "O tempo para pagamento expirou. Gere um novo PIX.",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [pixInfo, timeLeft, toast]);

  // Verificação automática de status
  useEffect(() => {
    if (pixInfo) {
      // Iniciar verificação imediatamente
      setTimeout(() => {
        verificarStatusPagamento(pixInfo.transactionId);
      }, 1000);
    }
  }, [pixInfo]);

  const buscarDadosTransacao = async (transactionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}/status`);
      const data = await response.json();

      if (data.status === 'approved') {
        // Pagamento já aprovado, redirecionar para sucesso
        setLocation(`/sucesso/${transactionId}`);
        return;
      }

      if (data.transaction) {
        setPixInfo({
          pixCode: data.transaction.pix_code,
          pixQRCode: data.transaction.pix_qr_code,
          transactionId: data.transaction.gateway_id,
          amount: data.transaction.amount,
          expiresAt: data.transaction.expires_at
        });

        // Calcular tempo restante
        const expiresAt = new Date(data.transaction.expires_at);
        const now = new Date();
        const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        setTimeLeft(diff);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do pagamento.",
        variant: "destructive",
      });
      setLocation('/entrega');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar o status do pagamento via API 4MPAGAMENTOS
  const verificarStatusPagamento = async (paymentId: string) => {
    console.log('[PAGAMENTO] 🔍 Verificando status do pagamento 4MPAGAMENTOS:', paymentId);
    
    try {
      // Usar nossa API local 4MPAGAMENTOS para verificar status
      const response = await fetch(`/api/transactions/${paymentId}/status`);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('[PAGAMENTO] ✅ Status obtido da 4MPAGAMENTOS:', statusData);
        
        // Verificar se o status é "paid"
        if (statusData.status === 'paid') {
          console.log('[PAGAMENTO] 🎉 Pagamento APROVADO! Redirecionando...');
          
          // Limpar o ID do pagamento do localStorage
          localStorage.removeItem('current_payment_id');
          
          // Envio de dados para webhook
          try {
            console.log('[PAGAMENTO] 📡 Enviando dados para webhook...');
            
            const webhookData = {
              nome: dadosUsuario?.nome,
              email: dadosUsuario?.email,
              telefone: dadosUsuario?.telefone?.replace(/\D/g, ''), // Apenas dígitos
              cpf: dadosUsuario?.cpf?.replace(/\D/g, ''), // Apenas dígitos
              estado: dadosUsuario?.estado,
              cidade: dadosUsuario?.cidade,
              endereco: dadosUsuario?.endereco,
              veiculo_tipo: dadosUsuario?.veiculoTipo,
              veiculo_placa: dadosUsuario?.veiculoPlaca,
              pagamento_status: 'aprovado',
              transacao_id: paymentId,
              valor_pago: pixInfo?.amount || 64.90
            };
            
            // Enviar para webhook com timeout de 30 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const webhookResponse = await fetch('/api/webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookData),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (webhookResponse.ok) {
              console.log('[PAGAMENTO] ✅ Webhook enviado com sucesso');
            } else {
              console.warn('[PAGAMENTO] ⚠️ Webhook falhou mas continuando:', webhookResponse.status);
            }
          } catch (webhookError) {
            console.warn('[PAGAMENTO] ⚠️ Erro no webhook mas continuando:', webhookError);
          }
          
          // Mostrar mensagem de sucesso
          toast({
            title: "Pagamento Aprovado!",
            description: "Seu pagamento foi processado com sucesso. Redirecionando...",
          });
          
          // Redirecionar para página de sucesso após 2 segundos
          setTimeout(() => {
            window.location.href = `https://delivery-partners-shopee.netlify.app/success_url?transaction_id=${paymentId}`;
          }, 2000);
          
          return; // Parar a verificação
        } else {
          console.log(`[PAGAMENTO] ⏳ Status ainda pendente: ${statusData.status}. Tentando novamente em 2s...`);
          // Se não está aprovado, agendar nova verificação em 2 segundos
          setTimeout(() => {
            verificarStatusPagamento(paymentId);
          }, 2000);
        }
      } else {
        console.error('[PAGAMENTO] ❌ Erro na API 4MPAGAMENTOS:', response.status, response.statusText);
        
        // Em caso de erro HTTP, agendar nova tentativa em 2 segundos
        setTimeout(() => {
          verificarStatusPagamento(paymentId);
        }, 2000);
      }
    } catch (error) {
      console.error('[PAGAMENTO] 💥 Erro ao verificar status:', error);
      
      // Em caso de erro de rede, agendar nova tentativa em 2 segundos
      setTimeout(() => {
        verificarStatusPagamento(paymentId);
      }, 2000);
    }
  };

  // Função para formatar o tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para copiar código PIX com correção específica para mobile
  const copiarCodigoPix = async (event?: React.MouseEvent | React.TouchEvent) => {
    console.log('[COPY] Função copiarCodigoPix chamada');
    
    // Prevenir comportamentos padrão que podem interferir
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!pixInfo?.pixCode) {
      console.log('[COPY] Nenhum código PIX disponível');
      return;
    }

    try {
      console.log('[COPY] Tentando copiar código PIX');
      
      // Método 1: Tentar usar navigator.clipboard (moderno)
      if (navigator.clipboard && window.isSecureContext) {
        console.log('[COPY] Usando navigator.clipboard');
        await navigator.clipboard.writeText(pixInfo.pixCode);
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
        });
        console.log('[COPY] Sucesso com navigator.clipboard');
        return;
      }
      
      console.log('[COPY] Fallback para execCommand');
      
      // Método 2: Fallback usando document.execCommand (compatibilidade)
      const textArea = document.createElement('textarea');
      textArea.value = pixInfo.pixCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      
      // Foco e seleção específicos para mobile
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('[COPY] Sucesso com execCommand');
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
        });
        return;
      }
      
      throw new Error('execCommand falhou');
      
    } catch (error) {
      console.error('[COPY] Erro ao copiar:', error);
      
      // Método 3: Fallback final específico para mobile
      try {
        console.log('[COPY] Tentando fallback final');
        
        // Criar input com configurações otimizadas para mobile
        const input = document.createElement('input');
        input.type = 'text';
        input.value = pixInfo.pixCode;
        input.style.position = 'absolute';
        input.style.top = '50%';
        input.style.left = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.opacity = '0.01'; // Quase invisível mas não 0
        input.style.zIndex = '999999';
        input.style.fontSize = '16px'; // Evita zoom no iOS
        input.style.width = '1px';
        input.style.height = '1px';
        input.setAttribute('readonly', '');
        
        document.body.appendChild(input);
        
        // Aguardar um tick para garantir que o elemento foi renderizado
        await new Promise(resolve => setTimeout(resolve, 10));
        
        input.focus();
        input.select();
        input.setSelectionRange(0, 99999);
        
        const copySuccess = document.execCommand('copy');
        
        // Remover após um pequeno delay
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }, 100);
        
        if (copySuccess) {
          console.log('[COPY] Sucesso com fallback final');
          toast({
            title: "Código PIX copiado!",
            description: "O código PIX foi copiado para a área de transferência.",
          });
        } else {
          throw new Error('Fallback final falhou');
        }
      } catch (fallbackError) {
        console.error('[COPY] Todos os métodos falharam:', fallbackError);
        toast({
          title: "Código PIX:",
          description: pixInfo.pixCode,
          duration: 10000,
        });
      }
    }
  };

  const voltarParaCadastro = () => {
    setLocation('/entrega');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#E83D22] mb-4">
            <Spinner size="lg" />
          </div>
          <p className="text-gray-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!pixInfo || !dadosUsuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dados não encontrados</h2>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados do pagamento.</p>
          <Button onClick={voltarParaCadastro} className="bg-[#E83D22] hover:bg-[#d73920]">
            Voltar ao Cadastro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={voltarParaCadastro}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              Voltar
            </button>
            <h1 className="text-lg font-bold text-gray-800">Pagamento do Kit</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          {/* Cabeçalho do pagamento */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Kit de Segurança Oficial</h2>
            <p className="text-sm text-gray-600">Finalize o pagamento para ativar seu cadastro Shopee</p>
          </div>

          {/* Detalhes do produto e usuário */}
          <div className="flex gap-4 items-start mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <img 
                src={kitEpiImage} 
                alt="Kit EPI Shopee" 
                className="w-20 rounded-md"
              />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-800 mb-2">Kit de Segurança Oficial</h3>
              <p className="text-2xl font-bold text-[#E83D22] mb-3">R$ 64,90</p>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Nome:</span> {dadosUsuario.nome}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">CPF:</span> {dadosUsuario.cpf}
                </p>
              </div>
            </div>
          </div>

          {/* Status de pagamento */}
          <div className="flex items-center justify-center gap-2 py-3 mb-6 bg-orange-50 rounded-lg">
            <div className="text-[#E83D22] animate-spin">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 font-medium">
              Aguardando pagamento PIX...
            </p>
          </div>

          {/* QR Code */}
          <div className="text-center mb-6">
            <img 
              src={pixLogo}
              alt="PIX Logo"
              className="h-8 mb-4 mx-auto"
            />
            <QRCodeGenerator 
              value={pixInfo.pixCode} 
              size={200}
              className="mx-auto mb-4"
              alt="QR Code PIX" 
            />
            
            {/* Tempo restante */}
            <div className="bg-orange-100 border-[#E83D22] border p-3 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className="text-[#E83D22]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  PIX expira em <span className="text-[#E83D22] font-bold">{formatTime(timeLeft)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Código PIX para cópia */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center font-medium">
              Copie o código PIX:
            </p>
            <div className="relative mb-3">
              <div 
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600 break-all pr-10 max-h-20 overflow-y-auto"
              >
                {pixInfo.pixCode}
              </div>
              <Button
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#E83D22] hover:text-[#d73920] p-1"
                onClick={(e) => {
                  console.log('[COPY] Botão pequeno clicado');
                  copiarCodigoPix(e);
                }}
                onTouchStart={(e) => {
                  console.log('[COPY] Botão pequeno touch');
                  e.preventDefault();
                  copiarCodigoPix(e);
                }}
                style={{
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </Button>
            </div>
            
            <Button
              onClick={(e) => {
                console.log('[COPY] Botão principal clicado');
                copiarCodigoPix(e);
              }}
              onTouchStart={(e) => {
                console.log('[COPY] Botão principal touch');
                e.preventDefault();
                setTimeout(() => copiarCodigoPix(e), 50);
              }}
              className="bg-[#E83D22] hover:bg-[#d73920] text-white font-medium py-3 w-full text-sm rounded-lg shadow-md transform active:translate-y-0.5 transition-transform"
              style={{ 
                boxShadow: "0 4px 0 0 #c23218",
                border: "none",
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                cursor: 'pointer'
              }}
            >
              Copiar Código PIX
            </Button>
          </div>

          {/* Instruções */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <p className="text-sm text-red-800">
              Após o pagamento, você será redirecionado automaticamente para finalizar o cadastro.
            </p>
          </div>
        </div>
      </div>

      {/* Botão flutuante do WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            const phoneNumber = "15558373106";
            const message = "Olá, desejo finalizar meu cadastro como Entregador Shopee.";
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }}
          className="bg-green-500 hover:bg-green-600 rounded-full p-4 shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.485"/>
          </svg>
        </button>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full shadow">
            Converse com um Gerente
          </span>
        </div>
      </div>
    </div>
  );
}