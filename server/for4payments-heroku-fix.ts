/**
 * CORREÇÃO HEROKU: Substituir script Python por JavaScript puro
 * Integração direta com 4mpagamentos para funcionar no Heroku
 */

interface For4PaymentsData {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  amount: number;
}

interface For4PaymentsResponse {
  success: boolean;
  data?: {
    id: number;
    transaction_id: string;
    pix_code: string;
    pix_qr_code: string;
    amount: number;
    status: string;
    expires_at: string | null;
    created_at: string;
  };
  error?: string;
}

/**
 * ✅ INTEGRAÇÃO DIRETA SEM PYTHON - Funciona no Heroku
 */
export async function createFor4PaymentHeroku(data: For4PaymentsData): Promise<For4PaymentsResponse> {
  try {
    const apiKey = process.env.MPAG_API_KEY;
    
    if (!apiKey) {
      throw new Error('MPAG_API_KEY não configurada no Heroku');
    }

    console.log('[HEROKU-4MPAG] 🚀 Criando pagamento PIX:', {
      nome: data.nome,
      email: data.email,
      amount: data.amount
    });

    const paymentData = {
      amount: data.amount,
      customer_name: data.nome,
      customer_email: data.email,
      customer_cpf: data.cpf,
      customer_phone: data.telefone || '',
      description: 'Kit de Segurança Shopee Delivery',
      // Campos extras para 4mpagamentos
      return_url: process.env.NODE_ENV === 'production' 
        ? 'https://sua-app.herokuapp.com/treinamento'
        : 'http://localhost:5000/treinamento',
      webhook_url: process.env.NODE_ENV === 'production'
        ? 'https://sua-app.herokuapp.com/api/4mpagamentos/webhook'
        : 'http://localhost:5000/api/4mpagamentos/webhook'
    };

    const response = await fetch('https://app.4mpagamentos.com/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HEROKU-4MPAG] ❌ Erro na API:', response.status, errorText);
      
      return {
        success: false,
        error: `Erro ${response.status}: ${errorText}`
      };
    }

    const result = await response.json();
    console.log('[HEROKU-4MPAG] ✅ Pagamento criado com sucesso:', {
      transaction_id: result.data?.transaction_id,
      status: result.data?.status
    });

    return {
      success: true,
      data: {
        id: result.data.id,
        transaction_id: result.data.transaction_id, // ✅ Campo correto para verificação
        pix_code: result.data.pix_code,
        pix_qr_code: result.data.pix_qr_code,
        amount: result.data.amount,
        status: result.data.status,
        expires_at: result.data.expires_at,
        created_at: result.data.created_at
      }
    };

  } catch (error: any) {
    console.error('[HEROKU-4MPAG] ❌ Erro na integração:', error.message);
    return {
      success: false,
      error: `Falha na integração: ${error.message}`
    };
  }
}