# Demo de Deploy Canary com Serverless (AWS SDK v3)

Este projeto demonstra como implementar deploy Canary em uma API serverless usando AWS Lambda, API Gateway e CodeDeploy com **AWS SDK v3** para JavaScript.

## 🎯 O que é Deploy Canary?

Deploy Canary é uma estratégia de deployment que reduz riscos ao liberar uma nova versão gradualmente:

1. **10% do tráfego** vai para a nova versão (canary)
2. **90% do tráfego** permanece na versão estável
3. Se não houver erros, o tráfego é gradualmente migrado
4. Se houver problemas, o rollback é automático

## 🏗️ Arquitetura

```
API Gateway → Lambda Alias (Live) → Weighted Routing
                                  ├─ 90% → Versão Estável
                                  └─ 10% → Nova Versão (Canary)
```

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Deploy inicial
```bash
npm run deploy
```

### 3. Deploy Canary (produção)
```bash
npm run deploy:canary
```

### 4. Testar distribuição de tráfego
```bash
# Configure a URL no test-endpoint-v3.js primeiro
API_URL=https://sua-api.execute-api.us-east-1.amazonaws.com/prod/hello npm run test:endpoint
```

### 5. Monitorar deploy canary
```bash
# Monitorar métricas em tempo real
npm run monitor lambda-canary-demo-prod-api
```

## 📊 Monitoramento

### CloudWatch Alarms
- **Errors**: Monitora erros na função Lambda
- **Duration**: Monitora latência
- **Throttles**: Monitora limitações

### Logs
```bash
npm run logs
```

### Monitoramento Avançado (AWS SDK v3)
```bash
# Monitorar distribuição de tráfego e métricas
npm run monitor:function lambda-canary-demo-prod-api
```

## 🔄 Processo de Deploy Canary

### Fase 1: Pre-Traffic Hook (2 min)
- Validações antes do tráfego ser direcionado
- Testes de smoke
- Verificação de configuração

### Fase 2: Canary Traffic (5 min)
- 10% do tráfego vai para a nova versão
- Monitoramento de métricas em tempo real
- Alarms verificam erros e performance

### Fase 3: Post-Traffic Hook
- Validações após o período canary
- Testes de integração
- Verificação de métricas

### Fase 4: Full Traffic
- Se tudo estiver OK, 100% do tráfego vai para a nova versão
- Versão anterior é mantida para rollback rápido

## 🚨 Rollback Automático

O rollback acontece automaticamente se:
- Taxa de erro > 0% (configurável)
- Latência muito alta
- Falha nos hooks de validação
- Alarms do CloudWatch são acionados

## 📝 Configurações Importantes

### serverless.yml
```yaml
deploymentSettings:
  type: Canary10Percent5Minutes  # 10% por 5 minutos
  alias: Live                    # Alias para produção
  preTrafficHook: preHook       # Validação antes
  postTrafficHook: postHook     # Validação depois
  alarms:                       # Alarms para rollback
    - AliasErrorMetricGreaterThanZeroAlarm
```

### Tipos de Deploy Disponíveis
- `Canary10Percent5Minutes`: 10% por 5 min, depois 100%
- `Canary10Percent10Minutes`: 10% por 10 min, depois 100%
- `Linear10PercentEvery1Minute`: +10% a cada minuto
- `AllAtOnce`: Deploy tradicional (sem canary)

## 🛠️ Troubleshooting

### Deploy falhou?
```bash
# Verificar logs do CodeDeploy
aws logs describe-log-groups --log-group-name-prefix /aws/codedeploy

# Verificar status do deployment
aws deploy list-deployments --application-name your-app
```

### Rollback manual
```bash
# Promover versão anterior
aws lambda update-alias --function-name your-function --name Live --function-version $PREVIOUS
```

## 📚 Próximos Passos

1. **Integrar com CI/CD**: GitHub Actions, GitLab CI, etc.
2. **Métricas customizadas**: Adicionar métricas de negócio
3. **Testes automatizados**: Integrar com ferramentas de teste
4. **Blue/Green**: Implementar estratégia alternativa
5. **Multi-região**: Deploy canary em múltiplas regiões

## 🔗 Links Úteis

- [AWS CodeDeploy Lambda](https://docs.aws.amazon.com/codedeploy/latest/userguide/applications-create-lambda.html)
- [Serverless Canary Plugin](https://github.com/davidgf/serverless-plugin-canary-deployments)
- [Lambda Aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)