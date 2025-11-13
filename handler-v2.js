// Exemplo de nova versão para testar deploy canary
// Substitua o conteúdo do handler.js por este código para simular uma nova versão

exports.hello = async (event) => {
  const version = process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`Request processed by NEW VERSION: ${version} at ${timestamp}`);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Lambda-Version': version,
      'X-Feature-Flag': 'new-feature-enabled'
    },
    body: JSON.stringify({
      message: `🚀 Hello from Lambda Canary Demo - NEW VERSION ${version}`,
      timestamp,
      version,
      environment: process.env.NODE_ENV || 'development',
      newFeature: {
        enabled: true,
        description: 'Esta é uma nova funcionalidade na versão canary',
        metrics: {
          processingTime: Math.random() * 100,
          memoryUsed: Math.floor(Math.random() * 128) + 'MB'
        }
      }
    })
  };
};