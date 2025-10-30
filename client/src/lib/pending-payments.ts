/**
 * Gerenciamento de pagamentos pendentes usando IndexedDB
 * Permite que o Service Worker acesse os dados mesmo quando não há abas abertas
 */

const DB_NAME = 'ShopeeDeliveryDB';
const STORE_NAME = 'pendingPayments';
const DB_VERSION = 1;

export interface PendingPayment {
  transactionId: string;
  timestamp: number;
  route: string;
  targetRoute: string;
  apiBaseUrl: string;
}

/**
 * Abre a conexão com o IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('❌ [IndexedDB] Erro ao abrir banco de dados');
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar o object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'transactionId' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('✅ [IndexedDB] Object store criado:', STORE_NAME);
      }
    };
  });
}

/**
 * Salvar pagamento pendente no IndexedDB
 */
export async function savePendingPayment(payment: PendingPayment): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.put(payment);
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    console.log('💾 [IndexedDB] Pagamento pendente salvo:', payment.transactionId);
    db.close();
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao salvar pagamento:', error);
    throw error;
  }
}

/**
 * Buscar pagamento pendente por ID
 */
export async function getPendingPayment(transactionId: string): Promise<PendingPayment | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(transactionId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    }).finally(() => db.close());
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao buscar pagamento:', error);
    return null;
  }
}

/**
 * Buscar todos os pagamentos pendentes
 */
export async function getAllPendingPayments(): Promise<PendingPayment[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(request.error);
      };
    }).finally(() => db.close());
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao buscar todos os pagamentos:', error);
    return [];
  }
}

/**
 * Remover pagamento pendente do IndexedDB
 */
export async function clearPendingPayment(transactionId?: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    if (transactionId) {
      // Remover pagamento específico
      store.delete(transactionId);
      console.log('🧹 [IndexedDB] Pagamento removido:', transactionId);
    } else {
      // Remover todos os pagamentos
      store.clear();
      console.log('🧹 [IndexedDB] Todos os pagamentos removidos');
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    db.close();
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao remover pagamento:', error);
    throw error;
  }
}

/**
 * Limpar pagamentos antigos (mais de 1 hora)
 */
export async function cleanOldPayments(): Promise<void> {
  try {
    const allPayments = await getAllPendingPayments();
    const now = Date.now();
    const MAX_AGE = 60 * 60 * 1000; // 1 hora
    
    for (const payment of allPayments) {
      const age = now - payment.timestamp;
      if (age > MAX_AGE) {
        await clearPendingPayment(payment.transactionId);
        console.log('⏰ [IndexedDB] Pagamento antigo removido:', payment.transactionId);
      }
    }
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao limpar pagamentos antigos:', error);
  }
}
