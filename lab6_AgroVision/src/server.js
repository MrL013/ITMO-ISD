import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  listFields,
  addTelemetry,
  getFieldSummary,
  addRecommendation
} from "./dataStore.js";
import { generateRecommendation } from "./llmService.js";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(res, pathname) {
  const filePath = pathname === "/" ? "/index.html" : pathname;
  const full = join(process.cwd(), "src", "public", filePath);

  try {
    const data = await readFile(full);
    const type = MIME[extname(full)] || "text/plain; charset=utf-8";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function isValidTelemetry(body) {
  return (
    typeof body.sensorId === "string" &&
    typeof body.fieldId === "string" &&
    typeof body.metric === "string" &&
    body.value !== undefined
  );
}

export function buildApp() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    try {
      if (req.method === "GET" && pathname === "/api/fields") {
        return json(res, 200, { items: listFields() });
      }

      if (req.method === "GET" && pathname.startsWith("/api/fields/") && pathname.endsWith("/summary")) {
        const fieldId = pathname.split("/")[3];
        const summary = getFieldSummary(fieldId);
        if (!summary) {
          return json(res, 404, { error: "Field not found" });
        }
        return json(res, 200, summary);
      }

      if (req.method === "POST" && pathname === "/api/telemetry") {
        const body = await parseBody(req);
        if (!isValidTelemetry(body)) {
          return json(res, 400, { error: "Invalid telemetry payload" });
        }
        const created = addTelemetry(body);
        return json(res, 201, created);
      }

      if (req.method === "POST" && pathname === "/api/recommendation") {
        const body = await parseBody(req);
        if (typeof body.fieldId !== "string") {
          return json(res, 400, { error: "fieldId is required" });
        }

        const summary = getFieldSummary(body.fieldId);
        if (!summary) {
          return json(res, 404, { error: "Field not found" });
        }

        const ai = await generateRecommendation(summary);
        const saved = addRecommendation({
          fieldId: body.fieldId,
          source: ai.source,
          text: ai.text,
          actions: ai.actions
        });

        return json(res, 200, { recommendation: saved, summary });
      }

      return serveStatic(res, pathname);
    } catch (err) {
      return json(res, 500, { error: "Server error", details: err.message });
    }
  });
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const server = buildApp();
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isEntryPoint) {
  startServer().then(() => {
    console.log("AgroVision prototype started on http://localhost:3000");
  });
}
