import { API_BASE_URL } from './api-config';
import { createPixPaymentDirect } from './for4payments-direct';

// Interface para os dados da solicitação de pagamento
interface PaymentRequest {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  amount?: number;
}

// Interface para a resposta do pagamento
interface PaymentResponse {
  id: string;
  pixCode: string;
  pixQrCode: string;
  status?: string;
  error?: string;
}

/**
 * Helper function para adicionar delay entre tentativas
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica se o erro é recuperável (deve tentar novamente)
 */
function isRetryableError(error: any): boolean {
  // Verificar se é um erro marcado como retryable
  if (error.isRetryable) {
    return true;
  }
  
  // Verificar tipos de erro de rede/timeout
  if (error.name === 'AbortError') {
    return true;
  }
  
  // Verificar mensagens de erro (com segurança)
  const errorMessage = error.message || '';
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('temporariamente indisponível') ||
    errorMessage.includes('demorou muito')
  );
}

/**
 * Cria uma solicitação de pagamento PIX através da API For4Payments
 * Esta função escolhe automaticamente a melhor estratégia:
 * 1. Se FOR4PAYMENTS_SECRET_KEY estiver disponível na Netlify - Chama direto a API
 * 2. Caso contrário - Usa o backend no Heroku como intermediário
 * 
 * Inclui sistema de retry automático com 3 tentativas e backoff exponencial
 */
export async function createPixPayment(data: PaymentRequest): Promise<PaymentResponse> {
  console.log(`Ambiente de execução: ${import.meta.env.PROD ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
  
  // Verificar se a chave da For4Payments está disponível no frontend
  // (Isso acontecerá se a variável estiver configurada no Netlify)
  const hasFor4PaymentKey = !!import.meta.env.VITE_FOR4PAYMENTS_SECRET_KEY;
  
  // Em produção, se tiver a chave, chama diretamente a API For4Payments
  if (import.meta.env.PROD && hasFor4PaymentKey) {
    console.log('Usando chamada direta para For4Payments API');
    
    try {
      // Usar a implementação direta
      return await createPixPaymentDirect(data);
    } catch (error: any) {
      console.error('Falha na chamada direta, tentando via Heroku:', error.message);
      // Em caso de erro, tenta via backend Heroku
    }
  }
  
  // Chamar via backend (sempre usar URL relativa)
  const apiUrl = '/api/proxy/for4payments/pix';
    
  console.log(`URL da API de pagamentos (via Heroku): ${apiUrl}`);
  console.log('Dados de pagamento:', {
    name: data.name,
    cpf: data.cpf.substring(0, 3) + '***' + data.cpf.substring(data.cpf.length - 2),
    email: data.email || 'não informado'
  });
  
  // Configurar opções de requisição
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: data.name,
      cpf: data.cpf,
      email: data.email || '',
      phone: data.phone || '',
      amount: data.amount || 14.90 // Valor padrão para o kit de segurança
    })
  };
  
  // Sistema de retry com backoff exponencial
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[PAGAMENTO] Tentativa ${attempt} de ${maxRetries}...`);
      
      // Fazer a requisição com timeout aumentado
      console.log('Enviando requisição para:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout
      
      const response = await fetch(apiUrl, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Resposta recebida, status:', response.status);
      
      // Verificar se a resposta foi bem sucedida
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro HTTP ${response.status}: ${errorText}`);
        
        // Criar erro com flag de retry para erros 5xx e timeouts
        const error: any = new Error();
        
        // Mensagens de erro mais específicas para o usuário
        if (response.status >= 500) {
          error.message = 'Serviço de pagamento temporariamente indisponível. Tente novamente em alguns instantes.';
          error.isRetryable = true; // Marcar como retryable
        } else if (response.status === 408 || response.status === 504) {
          error.message = 'A requisição demorou muito. Verifique sua conexão e tente novamente.';
          error.isRetryable = true; // Marcar como retryable
        } else {
          error.message = `Falha na comunicação com o servidor: ${response.statusText}`;
          error.isRetryable = false; // Erros 4xx não devem ser retentados
        }
        
        throw error;
      }
      
      // Processar a resposta
      let result;
      try {
        result = await response.json();
        console.log('Resposta do servidor processada:', result);
      } catch (jsonError: any) {
        console.error('Erro ao processar JSON da resposta:', jsonError);
        // JSON malformado ou vazio - marcar como retryable
        const error: any = new Error('Resposta do servidor está malformada. Tentando novamente...');
        error.isRetryable = true;
        throw error;
      }
      
      // Validar a resposta
      if (!result.pixCode || !result.id) {
        console.error('Resposta incompleta:', result);
        // Resposta sem dados necessários - marcar como retryable (pode ser erro temporário)
        const error: any = new Error('A resposta do servidor não contém os dados de pagamento PIX necessários');
        error.isRetryable = true;
        throw error;
      }
      
      console.log(`[PAGAMENTO] ✅ Sucesso na tentativa ${attempt}`);
      return result;
      
    } catch (error: any) {
      lastError = error;
      console.error(`[PAGAMENTO] ❌ Erro na tentativa ${attempt}:`, error.message);
      
      // Se não é um erro recuperável OU já é a última tentativa, lançar erro
      if (!isRetryableError(error) || attempt === maxRetries) {
        console.error('[PAGAMENTO] Erro não recuperável ou tentativas esgotadas');
        break;
      }
      
      // Calcular delay com backoff exponencial: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`[PAGAMENTO] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
      await delay(delayMs);
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error('[PAGAMENTO] Todas as tentativas falharam');
  
  // Mensagens de erro mais amigáveis
  const errorMessage = lastError?.message || '';
  
  if (lastError?.name === 'AbortError') {
    throw new Error('A operação demorou muito tempo. Verifique sua conexão com a internet e tente novamente.');
  } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
  }
  
  throw new Error(errorMessage || 'Não foi possível processar o pagamento no momento');
}