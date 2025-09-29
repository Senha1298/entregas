// Camada de adaptação e normalização para diferentes gateways de pagamento

interface NormalizedTransaction {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  description: string;
  pix_code: string;
  pix_qr_code: string;
  gateway_id: string;
  expires_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

interface NormalizedPaymentResponse {
  success: true;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  transaction: NormalizedTransaction;
}

export class PaymentAdapter {
  private transactionCache: Map<string, NormalizedTransaction>;
  
  constructor() {
    this.transactionCache = new Map();
  }

  /**
   * Normaliza status de diferentes gateways para formato padrão
   */
  private normalizeStatus(rawStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' {
    const status = rawStatus?.toLowerCase() || 'pending';
    
    if (['paid', 'approved', 'completed', 'success'].includes(status)) {
      return 'APPROVED';
    } else if (['rejected', 'cancelled', 'failed', 'expired'].includes(status)) {
      return 'REJECTED';
    } else {
      return 'PENDING';
    }
  }

  /**
   * Normaliza resposta da API 4MPagamentos para formato padrão
   */
  normalize4MPaymentResponse(rawData: any): NormalizedTransaction {
    const normalized: NormalizedTransaction = {
      id: rawData.gateway_id || rawData.transaction_id || rawData.id || '',
      status: this.normalizeStatus(rawData.status),
      amount: parseFloat(rawData.amount || '0'),
      customer_name: rawData.customer_name || '',
      customer_email: rawData.customer_email || '',
      customer_cpf: rawData.customer_cpf || '',
      description: rawData.description || 'Kit de Segurança Shopee Delivery',
      pix_code: rawData.pix_code || '',
      pix_qr_code: rawData.pix_qr_code || rawData.pix_code || '',
      gateway_id: rawData.gateway_id || rawData.transaction_id || rawData.id || '',
      expires_at: rawData.expires_at || null,
      approved_at: rawData.paid_at || rawData.approved_at || null,
      rejected_at: rawData.rejected_at || null,
      created_at: rawData.created_at || new Date().toISOString(),
      updated_at: rawData.updated_at || new Date().toISOString()
    };

    return normalized;
  }

  /**
   * Salva dados de transação no cache para garantir persistência
   */
  cacheTransaction(transactionId: string, data: NormalizedTransaction): void {
    try {
      this.transactionCache.set(transactionId, data);
      console.log(`[PAYMENT CACHE] Transação ${transactionId} salva no cache`);
    } catch (error) {
      console.error('[PAYMENT CACHE] Erro ao salvar no cache:', error);
    }
  }

  /**
   * Recupera dados de transação do cache
   */
  getCachedTransaction(transactionId: string): NormalizedTransaction | null {
    try {
      return this.transactionCache.get(transactionId) || null;
    } catch (error) {
      console.error('[PAYMENT CACHE] Erro ao recuperar do cache:', error);
      return null;
    }
  }

  /**
   * Mescla dados atualizados com dados em cache, preservando códigos PIX
   */
  mergeWithCache(transactionId: string, freshData: NormalizedTransaction): NormalizedTransaction {
    const cached = this.getCachedTransaction(transactionId);
    
    if (cached) {
      // Preservar códigos PIX do cache se não estiverem na resposta fresca
      const merged = {
        ...freshData,
        pix_code: freshData.pix_code || cached.pix_code,
        pix_qr_code: freshData.pix_qr_code || cached.pix_qr_code,
        customer_name: freshData.customer_name || cached.customer_name,
        customer_email: freshData.customer_email || cached.customer_email,
        customer_cpf: freshData.customer_cpf || cached.customer_cpf
      };
      
      console.log(`[PAYMENT MERGE] Dados mesclados para transação ${transactionId}`);
      return merged;
    }
    
    return freshData;
  }

  /**
   * Cria resposta normalizada para API
   */
  createNormalizedResponse(transaction: NormalizedTransaction): NormalizedPaymentResponse {
    return {
      success: true,
      status: transaction.status,
      transaction
    };
  }
}