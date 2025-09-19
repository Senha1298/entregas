# 🚀 COMANDOS PARA CORRIGIR HEROKU

## 1. CONFIGURAR VARIÁVEIS DE AMBIENTE

```bash
# ⚠️ CRÍTICO: Configure estas variáveis no Heroku
heroku config:set NODE_ENV=production
heroku config:set MPAG_API_KEY=sua_chave_4mpagamentos_aqui
heroku config:set FOR4PAYMENTS_SECRET_KEY=sua_chave_4mpagamentos_aqui
heroku config:set DATABASE_URL=sua_url_postgresql_aqui

# Verificar se foram configuradas
heroku config
```

## 2. VERIFICAR BUILDPACKS

```bash
# Garantir que Node.js está configurado
heroku buildpacks:add heroku/nodejs
heroku buildpacks
```

## 3. LOGS DE DEBUG

```bash
# Ver logs em tempo real para debug
heroku logs --tail

# Ver logs específicos de erro
heroku logs --tail | grep -i error
```

## 4. RESTART DA APLICAÇÃO

```bash
# Reiniciar após configurar variáveis
heroku restart
```

## 5. TESTE DE HEALTH CHECK

```bash
# Testar se a aplicação está funcionando
curl https://sua-app.herokuapp.com/health

# Deve retornar algo como:
# {
#   "status": "OK", 
#   "platform": "heroku",
#   "services": {
#     "database": true,
#     "payments": true
#   }
# }
```

## 🔧 PROBLEMAS COMUNS

### Erro: "Module not found"
```bash
# Limpar cache e reinstalar
heroku repo:purge_cache -a sua-app
git push heroku main
```

### Erro: "Database connection failed"
```bash
# Verificar addon PostgreSQL
heroku addons
heroku addons:create heroku-postgresql:mini
```

### Erro: "Payment API not configured"
```bash
# Verificar chaves de API
heroku config:get MPAG_API_KEY
heroku config:set MPAG_API_KEY=sua_chave_real
```

## ⚡ COMANDOS DE EMERGÊNCIA

Se nada funcionar, rebuild completo:
```bash
heroku apps:destroy sua-app
heroku create sua-app-nova
heroku addons:create heroku-postgresql:mini
# Configurar todas as variáveis novamente
git push heroku main
```