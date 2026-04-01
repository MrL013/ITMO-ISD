import { performance } from "node:perf_hooks";
import { startServer } from "../src/server.js";

const REQUESTS = Number(process.env.BENCH_REQUESTS || 200);
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY || 20);

async function run() {
  const server = await startServer(0);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/api/fields`;

  const latencies = [];
  const started = performance.now();

  async function worker(count) {
    for (let i = 0; i < count; i += 1) {
      const t0 = performance.now();
      const res = await fetch(url);
      await res.arrayBuffer();
      latencies.push(performance.now() - t0);
    }
  }

  const perWorker = Math.floor(REQUESTS / CONCURRENCY);
  const extra = REQUESTS % CONCURRENCY;

  const jobs = [];
  for (let i = 0; i < CONCURRENCY; i += 1) {
    jobs.push(worker(perWorker + (i < extra ? 1 : 0)));
  }

  await Promise.all(jobs);

  const totalMs = performance.now() - started;
  latencies.sort((a, b) => a - b);

  const p95 = latencies[Math.floor(latencies.length * 0.95) - 1];
  const avg = latencies.reduce((sum, x) => sum + x, 0) / latencies.length;
  const rps = (REQUESTS / totalMs) * 1000;

  console.log(`Requests: ${REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Avg latency: ${avg.toFixed(2)} ms`);
  console.log(`P95 latency: ${p95.toFixed(2)} ms`);
  console.log(`Throughput: ${rps.toFixed(2)} req/s`);
  console.log(`Memory RSS: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`);

  await new Promise((resolve) => server.close(resolve));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
