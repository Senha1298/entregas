import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { getAllPendingPayments, clearPendingPayment } from '@/lib/pending-payments';

/**
 * Componente que verifica pagamentos pendentes toda vez que o usuário carrega qualquer página
 * Isso garante que mesmo se o usuário sair da página /pagamento, ele será redirecionado quando o pagamento for aprovado
 */
const PaymentChecker = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkPendingPayments = async () => {
      try {
        const pendingPayments = await getAllPendingPayments();
        
        if (pendingPayments.length === 0) {
          return; // Nenhum pagamento pendente
        }
        
        console.log(`💳 [PaymentChecker] ${pendingPayments.length} pagamento(s) pendente(s) encontrado(s)`);
        
        // Verificar cada pagamento pendente
        for (const payment of pendingPayments) {
          const { transactionId, timestamp, targetRoute, apiBaseUrl } = payment;
          
          // Verificar se não é muito antigo (máximo 1 hora)
          const age = Date.now() - timestamp;
          const MAX_AGE = 60 * 60 * 1000; // 1 hora
          
          if (age > MAX_AGE) {
            console.log('⏰ [PaymentChecker] Transação muito antiga, removendo:', transactionId);
            await clearPendingPayment(transactionId);
            continue;
          }
          
          // Fazer request para verificar o status
          const url = `${apiBaseUrl}/api/transactions/${transactionId}/status?t=${Date.now()}`;
          
          console.log('📡 [PaymentChecker] Verificando:', transactionId);
          
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const statusUpper = data.status?.toUpperCase();
              
              // Verificar se foi aprovado
              if (['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED', 'SUCCESS'].includes(statusUpper)) {
                console.log('🎉 [PaymentChecker] PAGAMENTO APROVADO! Redirecionando para:', targetRoute);
                
                // Remover do IndexedDB
                await clearPendingPayment(transactionId);
                
                // Redirecionar
                setLocation(targetRoute);
                return; // Para de verificar outros pagamentos
              }
            } else {
              console.warn('⚠️ [PaymentChecker] Erro HTTP ao verificar pagamento:', response.status);
            }
          } catch (fetchError) {
            console.error('❌ [PaymentChecker] Erro ao fazer request:', fetchError);
          }
        }
      } catch (error) {
        console.error('❌ [PaymentChecker] Erro ao verificar pagamentos pendentes:', error);
      }
    };

    // Verificar imediatamente ao carregar
    checkPendingPayments();
    
    // Verificar periodicamente enquanto a página está aberta (a cada 5 segundos)
    const intervalId = setInterval(checkPendingPayments, 5000);
    
    return () => clearInterval(intervalId);
  }, [setLocation]);

  return null; // Este componente não renderiza nada
};

export default PaymentChecker;
