const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { LambdaClient, GetAliasCommand } = require('@aws-sdk/client-lambda');

const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function getCanaryMetrics(functionName, aliasName = 'Live') {
  try {
    // Obter informações do alias
    const aliasCommand = new GetAliasCommand({
      FunctionName: functionName,
      Name: aliasName
    });
    
    const aliasInfo = await lambdaClient.send(aliasCommand);
    console.log('Alias Info:', JSON.stringify(aliasInfo, null, 2));
    
    // Obter métricas de erro
    const errorMetricsCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/Lambda',
      MetricName: 'Errors',
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: functionName
        },
        {
          Name: 'Resource',
          Value: `${functionName}:${aliasName}`
        }
      ],
      StartTime: new Date(Date.now() - 10 * 60 * 1000), // Últimos 10 minutos
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Sum']
    });
    
    const errorMetrics = await cloudWatchClient.send(errorMetricsCommand);
    
    // Obter métricas de duração
    const durationMetricsCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/Lambda',
      MetricName: 'Duration',
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: functionName
        },
        {
          Name: 'Resource',
          Value: `${functionName}:${aliasName}`
        }
      ],
      StartTime: new Date(Date.now() - 10 * 60 * 1000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Average', 'Maximum']
    });
    
    const durationMetrics = await cloudWatchClient.send(durationMetricsCommand);
    
    return {
      alias: aliasInfo,
      errors: errorMetrics.Datapoints,
      duration: durationMetrics.Datapoints
    };
    
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    throw error;
  }
}

async function monitorCanaryDeployment(functionName) {
  console.log(`🔍 Monitorando deploy canary para função: ${functionName}\n`);
  
  try {
    const metrics = await getCanaryMetrics(functionName);
    
    console.log('📊 Métricas do Deploy Canary:');
    console.log('================================');
    
    if (metrics.alias.RoutingConfig) {
      console.log('Distribuição de Tráfego:');
      Object.entries(metrics.alias.RoutingConfig.AdditionalVersionWeights || {}).forEach(([version, weight]) => {
        console.log(`  Versão ${version}: ${weight * 100}%`);
      });
      console.log(`  Versão Principal (${metrics.alias.FunctionVersion}): ${100 - Object.values(metrics.alias.RoutingConfig.AdditionalVersionWeights || {}).reduce((a, b) => a + b, 0) * 100}%`);
    }
    
    console.log('\nErros (últimos 10 min):');
    if (metrics.errors.length > 0) {
      metrics.errors.forEach(point => {
        console.log(`  ${point.Timestamp}: ${point.Sum} erros`);
      });
    } else {
      console.log('  ✅ Nenhum erro detectado');
    }
    
    console.log('\nDuração (últimos 10 min):');
    if (metrics.duration.length > 0) {
      metrics.duration.forEach(point => {
        console.log(`  ${point.Timestamp}: Média ${point.Average?.toFixed(2)}ms, Máximo ${point.Maximum?.toFixed(2)}ms`);
      });
    } else {
      console.log('  ℹ️ Dados de duração não disponíveis');
    }
    
  } catch (error) {
    console.error('Falha no monitoramento:', error.message);
  }
}

if (require.main === module) {
  const functionName = process.argv[2] || 'lambda-canary-demo-dev-api';
  monitorCanaryDeployment(functionName);
}

module.exports = { getCanaryMetrics, monitorCanaryDeployment };