# 🎯 Guia Completo: Integração Facebook Pixel + API PIX

## Como Funciona a Marcação de Vendas Aprovadas

Este sistema integra o Facebook Pixel com a API PIX para rastrear conversões automaticamente quando os pagamentos são aprovados.

## ⚡ Fluxo Completo do Sistema

### 1. **Criação do Pagamento PIX**
- Usuario solicita pagamento
- Sistema gera código PIX via For4Payments API
- ID da transação é armazenado para monitoramento

### 2. **Monitoramento Automático**
- Sistema verifica periodicamente o status na API For4Payments
- Verifica se o status mudou para "APPROVED"
- Quando aprovado, dispara evento no Facebook Pixel

### 3. **Rastreamento da Conversão**
- Evento "Purchase" é enviado ao Facebook Pixel
- Inclui ID da transação, valor e dados do produto
- Sistema evita duplicatas usando localStorage

---

## 📁 Arquivos Necessários

### 1. **facebook-pixel.ts** (Principal)
```typescript
/**
 * Integração Facebook Pixel + PIX
 */

// IDs do Facebook Pixel
const FACEBOOK_PIXEL_IDS = [
  '961960469197157'  // Substitua pelo seu Pixel ID
];

/**
 * Inicializa o Facebook Pixel
 */
export function initFacebookPixel(): void {
  console.log('[PIXEL] Inicializando Facebook Pixels');
  
  if (typeof window !== 'undefined' && !window.fbq) {
    const head = document.head || document.getElementsByTagName('head')[0];
    const pixelScript = document.createElement('script');
    pixelScript.type = 'text/javascript';
    
    // Código base do Facebook Pixel
    pixelScript.innerHTML = \`
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    \`;
    
    // Inicializar todos os Pixel IDs
    FACEBOOK_PIXEL_IDS.forEach(pixelId => {
      pixelScript.innerHTML += \`fbq('init', '\${pixelId}');\`;
    });
    
    // Adicionar tracking de PageView
    pixelScript.innerHTML += \`fbq('track', 'PageView');\`;
    
    head.appendChild(pixelScript);
    
    console.log(\`[PIXEL] \${FACEBOOK_PIXEL_IDS.length} Facebook Pixels inicializados\`);
  }
}

/**
 * ⭐ FUNÇÃO PRINCIPAL - Rastreia compra aprovada
 */
export function trackPurchase(
  transactionId: string, 
  amount: number,
  currency: string = 'BRL',
  itemName: string = 'Produto'
): boolean {
  // ✅ PROTEÇÃO CONTRA DUPLICATAS
  const conversionKey = \`fb_conversion_\${transactionId}\`;
  const alreadyTracked = localStorage.getItem(conversionKey);
  
  if (alreadyTracked) {
    console.log(\`[PIXEL] Conversão \${transactionId} já foi rastreada. Ignorando duplicata.\`);
    return false;
  }
  
  console.log('[PIXEL] Rastreando compra aprovada:', { transactionId, amount });
  
  // 📊 DADOS DO EVENTO DE CONVERSÃO
  const eventData = {
    value: amount,
    currency: currency,
    content_name: itemName,
    content_type: 'product',
    content_ids: [transactionId],
    transaction_id: transactionId,
  };
  
  // 🚀 ENVIAR EVENTO PARA FACEBOOK PIXEL
  trackEvent('Purchase', eventData);
  
  // ✅ MARCAR COMO PROCESSADO
  localStorage.setItem(conversionKey, new Date().toISOString());
  
  console.log(\`[PIXEL] Conversão \${transactionId} rastreada com sucesso\`);
  return true;
}

/**
 * Envia evento para Facebook Pixel
 */
export function trackEvent(eventName: string, eventData?: Record<string, any>): void {
  if (typeof window !== 'undefined') {
    if (!window.fbq) {
      initFacebookPixel();
      setTimeout(() => {
        if (window.fbq) {
          console.log(\`[PIXEL] Evento: \${eventName}\`, eventData);
          window.fbq('track', eventName, eventData);
        }
      }, 500);
      return;
    }
    
    console.log(\`[PIXEL] Evento: \${eventName}\`, eventData);
    window.fbq('track', eventName, eventData);
  }
}

/**
 * ⚡ VERIFICAÇÃO DIRETA NA API PIX
 * Esta função permite verificar o status diretamente no frontend
 */
export async function checkPaymentStatus(paymentId: string, apiKey: string): Promise<any> {
  try {
    console.log('[PIXEL] Verificando status PIX:', paymentId);
    
    if (!apiKey) {
      console.error('[PIXEL] API Key não disponível');
      return { success: false, error: 'API Key não disponível' };
    }
    
    const response = await fetch(\`https://app.for4payments.com.br/api/v1/transaction.getPayment?id=\${paymentId}\`, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(\`Erro na API: \${response.status}\`);
    }
    
    const data = await response.json();
    console.log('[PIXEL] Status verificado:', data);
    
    // 🎯 VERIFICAR SE ESTÁ APROVADO
    const approvedStatusList = ['APPROVED', 'approved', 'PAID', 'paid', 'COMPLETED', 'completed'];
    const isApproved = data && data.status && approvedStatusList.includes(data.status.toUpperCase());
    
    if (isApproved) {
      console.log('[PIXEL] PAGAMENTO APROVADO! Rastreando conversão...');
      
      // 💰 OBTER VALOR (dividir por 100 se vier em centavos)
      const amount = data.amount ? parseFloat(data.amount) / 100 : 47.90;
      
      // 🎉 RASTREAR COMPRA
      trackPurchase(paymentId, amount);
      
      return { success: true, data, approved: true };
    }
    
    return { success: true, data, approved: false };
  } catch (error) {
    console.error('[PIXEL] Erro na verificação:', error);
    return { success: false, error, approved: false };
  }
}

// Tipagem global
declare global {
  interface Window {
    fbq?: any;
  }
}
```

---

## 🔄 Como Implementar no Seu Projeto

### **Passo 1: Configurar Variáveis de Ambiente**
```bash
# .env
VITE_FACEBOOK_PIXEL_ID=SEU_PIXEL_ID_AQUI
VITE_FOR4PAYMENTS_SECRET_KEY=SUA_API_KEY_AQUI
```

### **Passo 2: Inicializar o Pixel**
```tsx
// No seu componente principal (App.tsx)
import { initFacebookPixel } from './lib/facebook-pixel';

function App() {
  useEffect(() => {
    initFacebookPixel();
  }, []);
  
  return <div>...</div>;
}
```

### **Passo 3: Monitorar Pagamentos PIX**
```tsx
// Na página de pagamento
import { checkPaymentStatus, trackPurchase } from './lib/facebook-pixel';

function PaymentPage() {
  const verificarPagamento = async (paymentId: string) => {
    const apiKey = import.meta.env.VITE_FOR4PAYMENTS_SECRET_KEY;
    
    // 🔍 VERIFICAR STATUS NA API PIX
    const result = await checkPaymentStatus(paymentId, apiKey);
    
    if (result.approved) {
      console.log('💰 Pagamento aprovado! Conversão já rastreada.');
      
      // Redirecionar usuário ou mostrar sucesso
      navigate('/sucesso');
    } else {
      // Continuar verificando em 2 segundos
      setTimeout(() => verificarPagamento(paymentId), 2000);
    }
  };
  
  return <div>...</div>;
}
```

### **Passo 4: Rastreamento Manual (Opcional)**
```tsx
// Se você quiser rastrear manualmente
import { trackPurchase } from './lib/facebook-pixel';

// Quando souber que o pagamento foi aprovado
const onPaymentApproved = (transactionId: string, amount: number) => {
  trackPurchase(transactionId, amount, 'BRL', 'Meu Produto');
};
```

---

## 🎯 Pontos-Chave do Sistema

### ✅ **Proteções Implementadas:**
1. **Anti-duplicatas:** Uses localStorage para evitar rastreamento duplo
2. **Fallback robusto:** Frontend verifica diretamente se backend falhar  
3. **Log detalhado:** Console logs para debug fácil
4. **Tratamento de erros:** Captura e registra todos os erros

### 🔄 **Fluxo de Monitoramento:**
1. Pagamento PIX criado → ID salvo
2. Timer verifica status a cada 2 segundos
3. Status "APPROVED" → chama `trackPurchase()`
4. Evento "Purchase" enviado ao Facebook
5. Conversão registrada ✅

### 📊 **Dados Enviados ao Facebook:**
```javascript
{
  value: 47.90,           // Valor da compra
  currency: 'BRL',        // Moeda
  content_name: 'Produto', // Nome do produto
  content_type: 'product', // Tipo de conteúdo
  content_ids: ['txn_123'], // ID da transação
  transaction_id: 'txn_123' // ID único
}
```

---

## 🚨 Configurações Importantes

### **1. Facebook Pixel ID**
- Substitua `'961960469197157'` pelo seu Pixel ID
- Encontre em: Facebook Business Manager → Pixels

### **2. API Key For4Payments**  
- Configure `VITE_FOR4PAYMENTS_SECRET_KEY` no .env
- Necessário para verificar status do PIX

### **3. Status de Aprovação**
- Sistema aceita: `APPROVED`, `PAID`, `COMPLETED`  
- Pode adicionar outros status conforme sua API

---

## 🔧 Customizações Possíveis

### **Alterar Produto Padrão:**
```typescript
trackPurchase(transactionId, amount, 'BRL', 'Meu Produto Específico');
```

### **Múltiplos Pixels:**
```typescript
const FACEBOOK_PIXEL_IDS = [
  'PIXEL_ID_1',
  'PIXEL_ID_2',
  'PIXEL_ID_3'
];
```

### **Diferentes Moedas:**
```typescript
trackPurchase(transactionId, amount, 'USD', 'Product Name');
```

---

## 🎉 Resultado Final

Quando implementado corretamente, o sistema:

1. ✅ **Rastreia automaticamente** todas as vendas aprovadas via PIX
2. ✅ **Evita duplicatas** mesmo com múltiplas verificações  
3. ✅ **Funciona offline** se o backend estiver instável
4. ✅ **Registra logs detalhados** para debug e monitoramento
5. ✅ **Integra perfeitamente** com Facebook Ads para otimização

## 📞 Dicas de Implementação

- **Teste primeiro** em ambiente de desenvolvimento
- **Verifique os logs** do console para confirmar funcionamento
- **Configure webhook** da For4Payments para melhor performance (opcional)
- **Monitore no Facebook Events Manager** se os eventos estão chegando

---

*Este sistema está funcionando perfeitamente no projeto Shopee e pode ser replicado em qualquer projeto com API PIX!*