import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../src/server.js";

let server;
let port;

test.before(async () => {
  server = await startServer(0);
  port = server.address().port;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("GET /api/fields returns seeded fields", async () => {
  const res = await fetch(`http://127.0.0.1:${port}/api/fields`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.items));
  assert.ok(data.items.length >= 2);
});

test("POST /api/recommendation returns recommendation with source", async () => {
  const res = await fetch(`http://127.0.0.1:${port}/api/recommendation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldId: "field-1" })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.recommendation.id);
  assert.ok(["fallback", "openai"].includes(data.recommendation.source));
  assert.ok(Array.isArray(data.recommendation.actions));
});

test("POST /api/telemetry validates payload", async () => {
  const bad = await fetch(`http://127.0.0.1:${port}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldId: "field-1" })
  });

  assert.equal(bad.status, 400);

  const good = await fetch(`http://127.0.0.1:${port}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sensorId: "s-101",
      fieldId: "field-1",
      metric: "soil_moisture",
      value: 26.7
    })
  });

  assert.equal(good.status, 201);
});
