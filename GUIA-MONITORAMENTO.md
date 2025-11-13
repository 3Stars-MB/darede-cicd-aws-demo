# 🔍 Guia de Monitoramento - Deploy Canary

## 📍 Onde Olhar no Console AWS

### 1. **AWS Lambda Console**
```
AWS Console → Lambda → Functions → sua-função
```

**O que observar:**
- **Aliases**: Vá em "Aliases" - você verá o alias "Live"
- **Weighted Traffic**: No alias "Live", observe a distribuição:
  - Versão Principal: 90%
  - Nova Versão: 10%
- **Versions**: Veja as versões criadas ($LATEST, 1, 2, etc.)

### 2. **AWS CodeDeploy Console**
```
AWS Console → CodeDeploy → Applications
```

**O que observar:**
- **Application**: `ServerlessDeploymentApplication`
- **Deployment Groups**: Sua função Lambda
- **Deployments**: Status do deploy canary
  - ✅ **In Progress**: Deploy acontecendo
  - ✅ **Succeeded**: Deploy concluído
  - ❌ **Failed/Stopped**: Rollback executado

### 3. **CloudWatch Console**
```
AWS Console → CloudWatch → Alarms
```

**Alarms criados automaticamente:**
- `AliasErrorMetricGreaterThanZeroAlarm`
- `LatestVersionErrorMetricGreaterThanZeroAlarm`

## 🕐 Timeline do Deploy Canary

### Fase 1: Pre-Traffic Hook (0-2min)
```bash
# Verificar logs
aws logs filter-log-events --log-group-name /aws/lambda/sua-funcao-preHook
```
**O que procurar:**
- "Pre-traffic hook executed"
- "Pre-deployment validations passed"

### Fase 2: Canary Traffic (2-7min)
```bash
# Testar distribuição
npm run test:endpoint
```
**O que observar:**
- 10% das respostas vêm da nova versão
- 90% das respostas vêm da versão estável
- Headers `X-Lambda-Version` diferentes

### Fase 3: Post-Traffic Hook (7-10min)
```bash
# Verificar logs
aws logs filter-log-events --log-group-name /aws/lambda/sua-funcao-postHook
```
**O que procurar:**
- "Post-traffic hook executed"
- "Post-deployment validations passed"

### Fase 4: Full Traffic (10min+)
- 100% do tráfego vai para a nova versão
- Alias "Live" aponta totalmente para a nova versão

## 📊 Como Monitorar em Tempo Real

### 1. **Via CLI (Recomendado)**
```bash
# Monitorar métricas
npm run monitor sua-funcao-nome

# Testar distribuição
API_URL=sua-url npm run test:endpoint

# Ver logs em tempo real
npm run logs
```

### 2. **Via CloudWatch Metrics**
```
CloudWatch → Metrics → AWS/Lambda
```
**Métricas importantes:**
- **Errors**: Por versão/alias
- **Duration**: Latência por versão
- **Invocations**: Número de chamadas

### 3. **Via CloudWatch Logs**
```
CloudWatch → Log Groups → /aws/lambda/sua-funcao
```
**O que procurar:**
- Versão sendo executada: `AWS_LAMBDA_FUNCTION_VERSION`
- Distribuição de requests entre versões

## 🚨 Sinais de Rollback Automático

### No CodeDeploy Console:
- Status muda para "Failed" ou "Stopped"
- Reason: "CloudWatch alarm triggered"

### Nos Logs:
```
ERROR: Canary deployment error simulation
CloudWatch alarm: AliasErrorMetricGreaterThanZeroAlarm triggered
```

### No Lambda:
- Alias "Live" volta para versão anterior
- Tráfego 100% na versão estável

## 🔧 Comandos Úteis para Debug

### Verificar status do deployment:
```bash
aws deploy list-deployments --application-name ServerlessDeploymentApplication
```

### Ver detalhes do deployment:
```bash
aws deploy get-deployment --deployment-id d-XXXXXXXXX
```

### Verificar alias atual:
```bash
aws lambda get-alias --function-name sua-funcao --name Live
```

### Forçar rollback manual:
```bash
aws lambda update-alias --function-name sua-funcao --name Live --function-version VERSAO_ANTERIOR
```

## 📈 Interpretando os Resultados

### ✅ **Deploy Canary Bem-sucedido:**
- CodeDeploy status: "Succeeded"
- Sem alarms acionados
- Distribuição gradual: 10% → 100%
- Logs sem erros críticos

### ❌ **Deploy Canary com Rollback:**
- CodeDeploy status: "Failed/Stopped"
- Alarms acionados
- Tráfego volta para versão anterior
- Logs mostram erros na nova versão

### 📊 **Exemplo de Saída do Teste:**
```
Request 1: Version 2 - Status 200  ← Nova versão (10%)
Request 2: Version 1 - Status 200  ← Versão estável (90%)
Request 3: Version 1 - Status 200
Request 4: Version 1 - Status 200
Request 5: Version 2 - Status 200  ← Nova versão (10%)
...

Distribuição por versão:
  Version 1: 18 requests (90.0%)  ← Versão estável
  Version 2: 2 requests (10.0%)   ← Nova versão canary
```

## 🎯 Pontos-Chave para Observar

1. **Distribuição de Tráfego**: 90/10 durante canary, 100/0 após sucesso
2. **Tempo de Execução**: ~10 minutos total para deploy completo
3. **Alarms**: Devem permanecer em estado "OK"
4. **Logs**: Versões diferentes sendo executadas
5. **Performance**: Latência similar entre versões