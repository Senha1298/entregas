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
// Configuração da API - DIRETO para 4mpagamentos (CORRIGIDA!)
const DIRECT_API_ENDPOINT = 'https://app.4mpagamentos.com/api/v1/payments';
const DIRECT_STATUS_ENDPOINT = 'https://app.4mpagamentos.com/api/v1/transactions';

// Usar a chave correta do environment
const MPAG_API_KEY = "3mpag_p7czqd3yk_mfr1pvd2";

// Função para verificar status VIA CHAMADA DIRETA (usando gateway_id correto)
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
        customer_name: paymentData.customer_name,
        customer_email: paymentData.customer_email,
        customer_cpf: paymentData.customer_cpf,
        customer_phone: paymentData.customer_phone,
        description: paymentData.description
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
    console.log('[4MPAGAMENTOS-DIRECT] ✅ Transação criada:', transaction);
    
    // 2. VERIFICAÇÃO DE STATUS URGENTE (A CADA 1 SEGUNDO) - usando gateway_id correto
    console.log('[4MPAGAMENTOS-DIRECT] 🚨 Iniciando verificação urgente de status para gateway_id:', transaction.gateway_id);
    
    // VERIFICAÇÃO IMEDIATA - caso já esteja pago
    const checkStatus = async (): Promise<void> => {
      try {
        console.log('[4MPAGAMENTOS-DIRECT] 🔍 Verificando transação gateway_id:', transaction.gateway_id);
        const statusResponse = await fetch(`${DIRECT_STATUS_ENDPOINT}/${transaction.gateway_id}`, {
          headers: {
            'Authorization': `Bearer ${MPAG_API_KEY}`,
            'Accept': 'application/json'
          }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[4MPAGAMENTOS-DIRECT] ✅ Status verificado:', statusData.status, 'para transação:', transaction.gateway_id);
          
          if (statusData.status === 'paid' || statusData.status === 'approved' || statusData.status === 'PAID' || statusData.status === 'APPROVED' || statusData.status === 'COMPLETED') {
            console.log('[4MPAGAMENTOS-DIRECT] 🎉 PAGAMENTO CONFIRMADO! Redirecionando AGORA...');
            
            // Redirecionamento INSTANTÂNEO
            handleRedirect();
            return; // Para o loop
          } else if (statusData.status === 'expired' || statusData.status === 'cancelled') {
            console.log('[4MPAGAMENTOS-DIRECT] Transação expirada ou cancelada');
            return; // Para o loop
          }
        } else {
          const errorText = await statusResponse.text();
          console.error('[4MPAGAMENTOS-DIRECT] ❌ Erro na resposta:', statusResponse.status, errorText);
        }
      } catch (error) {
        console.error('[4MPAGAMENTOS-DIRECT] Erro ao verificar status:', error);
      }
      
      // Continua verificando após 1 segundo
      setTimeout(() => checkStatus(), 1000);
    };
    
    // Inicia verificação
    checkStatus();
    
    // Retorna os dados da transação usando a estrutura correta da API 4mpagamentos
    return {
      id: transaction.gateway_id,
      transactionId: transaction.gateway_id,
      pixCode: transaction.pixCode || transaction.qr_code,
      pixQrCode: transaction.pixQrCode || transaction.qr_code_url,
      amount: transaction.amount,
      status: transaction.status,
      expiresAt: transaction.expiresAt || transaction.expires_at,
      createdAt: transaction.createdAt || transaction.created_at
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