const https = require("https");

const API_URL =
  process.env.API_URL ||
  "https://8qk85htqf0.execute-api.us-east-1.amazonaws.com/dev/hello";

async function makeRequest() {
  return new Promise((resolve, reject) => {
    https
      .get(API_URL, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              version: res.headers["x-lambda-version"],
              body: response,
            });
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function testCanaryDeployment() {
  console.log("🚀 Testando deploy Canary com AWS SDK v3...\n");

  const requests = 20;
  const results = {
    versions: {},
    errors: 0,
    total: requests,
  };

  for (let i = 0; i < requests; i++) {
    try {
      const response = await makeRequest();
      const version = response.version || "unknown";

      results.versions[version] = (results.versions[version] || 0) + 1;

      console.log(
        `Request ${i + 1}: Version ${version} - Status ${response.statusCode}`
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.errors++;
      console.error(`Request ${i + 1}: ERROR - ${error.message}`);
    }
  }

  console.log("\n📊 Resultados do teste:");
  console.log(`Total de requests: ${results.total}`);
  console.log(`Erros: ${results.errors}`);
  console.log("Distribuição por versão:");

  Object.entries(results.versions).forEach(([version, count]) => {
    const percentage = ((count / results.total) * 100).toFixed(1);
    console.log(`  Version ${version}: ${count} requests (${percentage}%)`);
  });
}

if (require.main === module) {
  testCanaryDeployment().catch(console.error);
}

module.exports = { testCanaryDeployment };
