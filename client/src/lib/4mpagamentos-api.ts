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

// 🚨 CHAMADA DIRETA - SEM PROXY! 
// Configuração da API - DIRETO para 4mpagamentos
const DIRECT_API_ENDPOINT = 'https://api.4mpagamentos.com.br/v2/transactions';
const DIRECT_STATUS_ENDPOINT = 'https://api.4mpagamentos.com.br/v2/transactions';

// ⚠️ ATENÇÃO: Usando chave da API DIRETO no frontend para DEBUGGING!
const MPAG_API_KEY = "99cd3b40-5b05-4a40-a30c-4ed3b3bdde75";

// Função para verificar status VIA CHAMADA DIRETA
async function checkTransactionStatus(transactionId: string): Promise<any> {
  try {
    console.log('[4MPAGAMENTOS-DIRECT] 🔍 Verificando status DIRETO:', transactionId);
    const response = await fetch(`${DIRECT_STATUS_ENDPOINT}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MPAG_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[4MPAGAMENTOS-DIRECT] ✅ Status recebido DIRETO:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.error('[4MPAGAMENTOS-DIRECT] ❌ Erro ao verificar status:', response.status, errorText);
    }
  } catch (error) {
    console.error('[4MPAGAMENTOS-DIRECT] 💥 Erro de rede ao verificar status:', error);
  }
  return null;
}

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
    console.log('[4MPAGAMENTOS-DIRECT] 🚨 Criando transação PIX DIRETAMENTE na API...');
    console.log('[4MPAGAMENTOS-DIRECT] Dados enviados:', paymentData);
    
    // 1. CRIAÇÃO DA TRANSAÇÃO - CHAMADA DIRETA!
    const response = await fetch(DIRECT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MPAG_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: "BRL",
        payment_method: "pix",
        description: paymentData.description,
        customer: {
          name: paymentData.customer_name,
          email: paymentData.customer_email,
          document: paymentData.customer_cpf,
          phone: paymentData.customer_phone
        }
      })
    });
    
    console.log('[4MPAGAMENTOS-DIRECT] Status da resposta:', response.status);
    console.log('[4MPAGAMENTOS-DIRECT] Headers da resposta:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('[4MPAGAMENTOS-DIRECT] Resposta raw:', responseText);
    
    if (!response.ok) {
      throw new Error(`Erro ao criar pagamento DIRETO: ${response.status} - ${responseText}`);
    }
    
    const transaction = JSON.parse(responseText);
    console.log('[4MPAGAMENTOS] Transação criada:', transaction);
    
    // 2. VERIFICAÇÃO DE STATUS URGENTE (A CADA 1 SEGUNDO)
    console.log('[4MPAGAMENTOS] 🚨 Iniciando verificação urgente de status para transactionId:', transaction.transactionId);
    
    // VERIFICAÇÃO IMEDIATA - caso já esteja pago
    const checkStatus = async (): Promise<void> => {
      try {
        console.log('[4MPAGAMENTOS] 🔍 Verificando transação ID que começa com 4M:', transaction.transactionId);
        const statusResponse = await fetch(`${STATUS_ENDPOINT}/${transaction.transactionId}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[4MPAGAMENTOS] ✅ Status verificado:', statusData.status, 'para transação:', transaction.transactionId);
          
          if (statusData.status === 'paid' || statusData.status === 'approved' || statusData.status === 'PAID' || statusData.status === 'APPROVED' || statusData.status === 'COMPLETED') {
            console.log('[4MPAGAMENTOS] 🎉 PAGAMENTO CONFIRMADO! Redirecionando AGORA...');
            
            // Redirecionamento INSTANTÂNEO
            handleRedirect();
            return; // Para o loop
          } else if (statusData.status === 'expired' || statusData.status === 'cancelled') {
            console.log('[4MPAGAMENTOS] Transação expirada ou cancelada');
            return; // Para o loop
          }
        } else {
          console.error('[4MPAGAMENTOS] ❌ Erro na resposta:', statusResponse.status, 'para ID:', transaction.transactionId);
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
  console.log('[FRONTEND-DEBUG] createPixPayment recebeu dados:', data);
  console.log('[FRONTEND-DEBUG] Nome presente:', !!data.name, 'Valor:', data.name);
  console.log('[FRONTEND-DEBUG] CPF presente:', !!data.cpf, 'Valor:', data.cpf);
  
  // Validar dados obrigatórios no frontend
  if (!data.name || !data.cpf) {
    console.error('[FRONTEND-ERROR] Dados obrigatórios faltando:', { name: !!data.name, cpf: !!data.cpf });
    throw new Error(`Dados obrigatórios faltando: ${!data.name ? 'Nome' : ''} ${!data.cpf ? 'CPF' : ''}`.trim());
  }
  
  const amount = data.amount || 64.90; // Valor padrão
  
  const paymentData = {
    amount: amount,
    customer_name: data.name,
    customer_email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@mail.shopee.br`,
    customer_cpf: data.cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
    customer_phone: data.phone || generateRandomPhone(),
    description: "Kit de Segurança Shopee Delivery"
  };
  
  console.log('[FRONTEND-DEBUG] Enviando para servidor:', {
    ...paymentData,
    customer_cpf: paymentData.customer_cpf.substring(0, 3) + '***' + paymentData.customer_cpf.substring(paymentData.customer_cpf.length - 2)
  });
  
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