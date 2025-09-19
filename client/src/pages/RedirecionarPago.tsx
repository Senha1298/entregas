import { useEffect } from 'react';
import { useRoute } from 'wouter';

/**
 * Página que redireciona automaticamente transações já pagas
 * SOLUÇÃO URGENTE para transação 4M740917 que já foi paga
 */
export function RedirecionarPago() {
  const [, params] = useRoute('/redirecionar-pago/:transactionId');
  
  useEffect(() => {
    const transactionId = params?.transactionId || '4M740917'; // Default para sua transação paga
    
    console.log('[REDIRECIONAMENTO-URGENTE] Verificando transação paga:', transactionId);
    
    // Função para verificar se a transação está paga e redirecionar
    const checkAndRedirect = async () => {
      try {
        const response = await fetch(`/api/4mpagamentos/check-paid/${transactionId}`);
        const data = await response.json();
        
        console.log('[REDIRECIONAMENTO-URGENTE] Resposta da API:', data);
        
        if (data.isPaid && data.shouldRedirect) {
          console.log('[REDIRECIONAMENTO-URGENTE] 🎉 TRANSAÇÃO PAGA! Redirecionando para:', data.redirectTo);
          
          // Redireciona IMEDIATAMENTE
          window.location.href = data.redirectTo;
        } else {
          console.log('[REDIRECIONAMENTO-URGENTE] Transação ainda não paga, tentando novamente em 1 segundo');
          setTimeout(checkAndRedirect, 1000);
        }
      } catch (error) {
        console.error('[REDIRECIONAMENTO-URGENTE] Erro:', error);
        setTimeout(checkAndRedirect, 2000);
      }
    };
    
    // Inicia verificação imediata
    checkAndRedirect();
  }, [params?.transactionId]);
  
  return (
    <div className="font-['Roboto',sans-serif] bg-[#F5F5F5] text-sm min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE4E2E] mx-auto"></div>
          </div>
          <h1 className="text-xl font-bold text-[#10172A] mb-2">
            Verificando Pagamento
          </h1>
          <p className="text-gray-600 mb-4">
            Detectamos que seu pagamento foi aprovado! 
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para a área de treinamento...
          </p>
          <div className="mt-6 p-4 bg-green-100 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Pagamento Confirmado!
            </p>
            <p className="text-green-600 text-sm">
              Você será redirecionado automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}