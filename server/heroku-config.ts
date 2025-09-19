/**
 * CONFIGURAÇÃO ESPECÍFICA PARA HEROKU
 * Resolve problemas de CORS, URLs e variáveis de ambiente
 */

import { Express } from 'express';

export function configureForHeroku(app: Express) {
  const isHeroku = process.env.NODE_ENV === 'production' && process.env.PORT;
  
  if (isHeroku) {
    console.log('[HEROKU] 🚀 Configurando aplicação para Heroku...');
    
    // 1. CORS PERMISSIVO PARA HEROKU
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      next();
    });
    
    // 2. HEALTH CHECK ESPECÍFICO HEROKU
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        platform: 'heroku',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        services: {
          database: !!process.env.DATABASE_URL,
          payments: !!process.env.MPAG_API_KEY,
          for4payments: !!process.env.FOR4PAYMENTS_SECRET_KEY
        }
      });
    });
    
    // 3. VERIFICAÇÃO DE VARIÁVEIS CRÍTICAS
    const requiredVars = [
      'DATABASE_URL',
      'MPAG_API_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('[HEROKU] ❌ VARIÁVEIS FALTANDO:', missingVars);
      console.error('[HEROKU] Configure com: heroku config:set VARIAVEL=valor');
    } else {
      console.log('[HEROKU] ✅ Todas as variáveis necessárias estão configuradas');
    }
    
    // 4. TRUSTED PROXY PARA HEROKU
    app.set('trust proxy', 1);
    
    // 5. TIMEOUT CONFIGURAÇÃO
    app.use((req, res, next) => {
      res.setTimeout(25000); // 25s timeout para Heroku
      next();
    });
  }
}

/**
 * Detectar ambiente Heroku
 */
export function isHerokuEnvironment(): boolean {
  return !!(process.env.NODE_ENV === 'production' && process.env.PORT && process.env.DYNO);
}

/**
 * Obter URL base do Heroku
 */
export function getHerokuBaseUrl(): string {
  if (isHerokuEnvironment()) {
    // Se tiver variável HEROKU_APP_NAME, usar ela
    if (process.env.HEROKU_APP_NAME) {
      return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    }
    
    // Senão, tentar deduzir do REQUEST
    return process.env.HEROKU_URL || 'https://sua-app.herokuapp.com';
  }
  
  return 'http://localhost:5000';
}