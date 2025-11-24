const path = require('path');
const fs = require('fs');
const newman = require('newman');

const CONCURRENCY = 10; // number of parallel runs
const COLLECTION_PATH = path.resolve(__dirname, '../postman/Fibonacci.postman_collection.json');
const REPORTS_DIR = path.resolve(__dirname, '../loadtest/reports');
const BASE_URL = process.env.FUNC_BASE_URL || 'https://REPLACE_WITH_FUNCTION.azurewebsites.net';

fs.mkdirSync(REPORTS_DIR, { recursive: true });

function runOnce(index) {
  return new Promise((resolve, reject) => {
    newman.run({
      collection: require(COLLECTION_PATH),
      envVar: [
        { key: 'baseUrl', value: BASE_URL }
      ],
      reporters: ['cli', 'json', 'htmlextra'],
      reporter: {
        json: { export: path.join(REPORTS_DIR, `run-${index}.json`) },
        htmlextra: { export: path.join(REPORTS_DIR, `run-${index}.html`) }
      },
      timeoutRequest: 60000
    }, (err, summary) => {
      if (err) return reject(err);
      resolve(summary);
    });
  });
}

async function main() {
  console.log(`Starting ${CONCURRENCY} concurrent runs against ${BASE_URL}`);
  const started = Date.now();
  const results = await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => runOnce(i)));
  const ended = Date.now();

  // Aggregate metrics
  let totalRequests = 0;
  let totalFailures = 0;
  let totalResponseTime = 0;

  results.forEach(r => {
    const executions = r.run.executions || [];
    executions.forEach(ex => {
      totalRequests += 1;
      if (ex.response) {
        totalResponseTime += ex.response.responseTime || 0;
      }
      if (ex.assertions) {
        ex.assertions.forEach(a => { if (a.error) totalFailures += 1; });
      }
    });
  });

  const avgResponseTime = totalRequests ? (totalResponseTime / totalRequests) : 0;
  const aggregate = {
    baseUrl: BASE_URL,
    concurrency: CONCURRENCY,
    totalDurationMs: ended - started,
    totalRequests,
    totalFailures,
    averageResponseTimeMs: avgResponseTime
  };

  fs.writeFileSync(path.join(REPORTS_DIR, 'aggregate.json'), JSON.stringify(aggregate, null, 2));
  fs.writeFileSync(path.join(REPORTS_DIR, 'aggregate.md'), `# Load Test Aggregate Result\n\n` +
    `Base URL: ${BASE_URL}\n` +
    `Concurrency: ${CONCURRENCY}\n` +
    `Total Duration (ms): ${aggregate.totalDurationMs}\n` +
    `Total Requests: ${totalRequests}\n` +
    `Total Failures: ${totalFailures}\n` +
    `Average Response Time (ms): ${avgResponseTime.toFixed(2)}\n`);

  console.log('Aggregate metrics written to reports/aggregate.json and aggregate.md');
}

main().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
