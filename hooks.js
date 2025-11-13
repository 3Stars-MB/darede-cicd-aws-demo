const { CodeDeployClient, PutLifecycleEventHookExecutionStatusCommand } = require('@aws-sdk/client-codedeploy');

const codeDeployClient = new CodeDeployClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.preTrafficHook = async (event) => {
  console.log('Pre-traffic hook executed');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const deploymentId = event.DeploymentId;
  const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;
  
  try {
    console.log('Running pre-deployment validations...');
    
    // Simula validação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Pre-deployment validations passed');
    
    // Sinaliza sucesso para o CodeDeploy
    const command = new PutLifecycleEventHookExecutionStatusCommand({
      deploymentId,
      lifecycleEventHookExecutionId,
      status: 'Succeeded'
    });
    
    await codeDeployClient.send(command);
    
    return { statusCode: 200 };
  } catch (error) {
    console.error('Pre-traffic hook failed:', error);
    
    const command = new PutLifecycleEventHookExecutionStatusCommand({
      deploymentId,
      lifecycleEventHookExecutionId,
      status: 'Failed'
    });
    
    await codeDeployClient.send(command);
    
    throw error;
  }
};

exports.postTrafficHook = async (event) => {
  console.log('Post-traffic hook executed');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const deploymentId = event.DeploymentId;
  const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;
  
  try {
    console.log('Running post-deployment validations...');
    
    // Simula validação pós-deploy
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Post-deployment validations passed');
    
    const command = new PutLifecycleEventHookExecutionStatusCommand({
      deploymentId,
      lifecycleEventHookExecutionId,
      status: 'Succeeded'
    });
    
    await codeDeployClient.send(command);
    
    return { statusCode: 200 };
  } catch (error) {
    console.error('Post-traffic hook failed:', error);
    
    const command = new PutLifecycleEventHookExecutionStatusCommand({
      deploymentId,
      lifecycleEventHookExecutionId,
      status: 'Failed'
    });
    
    await codeDeployClient.send(command);
    
    throw error;
  }
};