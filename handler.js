exports.hello = async (event) => {
  const version = 4;
  const timestamp = new Date().toISOString();

  console.log(`Request processed by version: ${version} at ${timestamp}`);

  // Simula uma alta chance de erro para demonstrar rollback
  const shouldFail = Math.random() < 0.5; // 50% chance de falha

  if (shouldFail && version !== "$LATEST") {
    console.error("Simulated error in canary version");
    throw new Error("Canary deployment error simulation");
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Lambda-Version": version,
    },
    body: JSON.stringify({
      message: `🚀 NEW VERSION  - Lambda Canary Demo - Version ${version}`,
      timestamp,
      version,
      environment: "development",
    }),
  };
};
