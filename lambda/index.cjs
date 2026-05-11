/* eslint-disable @typescript-eslint/no-require-imports */
// AWS Lambda handler for the hack-26 Next.js app.
//
// Strategy: boot the standalone-emitted server.js in-process (it binds a
// Node HTTP server to 127.0.0.1:PORT) and proxy each Lambda invocation
// to it via http.request. This is the same pattern as AWS Lambda Web
// Adapter but kept in JS so we don't need a custom layer.
//
// Why not call NextServer.getRequestHandler() directly? It only handles
// app/page routes — the full filesystem/static-files pipeline lives in
// next/dist/server/lib/router-server, which `startServer` mounts and
// `server.js` boots. Skipping that path makes POSTs crash with
// Runtime.NodeJsExit on Node 22.

const http = require("node:http");
const path = require("node:path");

const PORT = 3000;
process.env.PORT = String(PORT);
process.env.HOSTNAME = "127.0.0.1";
process.env.NEXT_TELEMETRY_DISABLED = "1";

process.on("unhandledRejection", (reason) => {
  console.error("[lambda] unhandledRejection", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[lambda] uncaughtException", err);
});

console.log("[lambda] cold start", {
  node: process.version,
  arch: process.arch,
  region: process.env.AWS_REGION,
});

// Boot the standalone server. It starts an HTTP listener on PORT;
// startServer() inside it never resolves under normal operation.
require(path.join(__dirname, "server.js"));

let readyPromise = null;
function waitUntilReady(deadlineMs = 30000) {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve, reject) => {
    const start = Date.now();
    const probe = () => {
      const req = http.request(
        { host: "127.0.0.1", port: PORT, path: "/", method: "HEAD", timeout: 1000 },
        (res) => {
          res.resume();
          resolve();
        },
      );
      req.on("error", () => {
        if (Date.now() - start > deadlineMs) {
          reject(new Error("standalone server never became ready"));
        } else {
          setTimeout(probe, 100);
        }
      });
      req.on("timeout", () => req.destroy());
      req.end();
    };
    probe();
  });
  return readyPromise;
}

const BINARY_CT = /^(image|video|audio|font)\/|^application\/(pdf|zip|octet-stream)/i;

function forward(event) {
  const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";
  const rawPath = event?.rawPath || event?.path || "/";
  const rawQuery = event?.rawQueryString || "";
  const fullPath = rawQuery ? `${rawPath}?${rawQuery}` : rawPath;

  // Normalize headers: APIGW v2 lowercases them already, but we drop host
  // so the standalone server sees its own host.
  const headers = {};
  for (const [k, v] of Object.entries(event?.headers || {})) {
    if (k.toLowerCase() === "host") continue;
    headers[k] = v;
  }
  headers["host"] = `127.0.0.1:${PORT}`;

  let bodyBuf = null;
  if (event?.body != null) {
    bodyBuf = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "utf8");
    headers["content-length"] = String(bodyBuf.length);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: PORT,
        path: fullPath,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const ct = res.headers["content-type"] || "";
          const isBin = BINARY_CT.test(ct);
          // APIGW v2 wants headers as a flat string map; arrays go into
          // a separate `cookies` field.
          const respHeaders = {};
          const cookies = [];
          for (const [k, v] of Object.entries(res.headers)) {
            if (k.toLowerCase() === "set-cookie") {
              if (Array.isArray(v)) cookies.push(...v);
              else if (v) cookies.push(String(v));
              continue;
            }
            respHeaders[k] = Array.isArray(v) ? v.join(", ") : String(v);
          }
          resolve({
            statusCode: res.statusCode || 500,
            headers: respHeaders,
            cookies,
            body: isBin ? buf.toString("base64") : buf.toString("utf8"),
            isBase64Encoded: isBin,
          });
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await waitUntilReady();
    return await forward(event);
  } catch (err) {
    console.error("[lambda] handler error", err);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "lambda_handler",
        message: err?.message ?? String(err),
        node: process.version,
      }),
    };
  }
};
