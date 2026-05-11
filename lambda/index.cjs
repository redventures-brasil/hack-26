/* eslint-disable @typescript-eslint/no-require-imports */
// AWS Lambda handler for the hack-26 Next.js app.
//
// Layout when packaged: this file sits at the root of the Lambda zip,
// alongside the `next build --output=standalone` output (server.js,
// node_modules/, .next/, public/, package.json). The CI workflow assembles
// that layout in .github/workflows/deploy.yml.

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const serverless = require("serverless-http");

process.env.NEXT_RUNTIME = "nodejs";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const PUBLIC_DIR = path.join(__dirname, "public");

const required = require(path.join(__dirname, ".next/required-server-files.json"));

const NextServer = require("next/dist/server/next-server").default;

const nextServer = new NextServer({
  conf: required.config,
  dir: __dirname,
  dev: false,
  customServer: false,
  minimalMode: false,
  hostname: "127.0.0.1",
  port: 3000,
});

const handleNext = nextServer.getRequestHandler();

// Minimal content-type table for the files we actually ship under public/.
const MIME = {
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".pdf": "application/pdf",
};

// Plain-Node http server. We special-case `public/` (Next's standalone
// NextServer doesn't serve it on its own — only the full router-server
// pipeline that `startServer` boots does, and we can't use that here
// because it binds a port). Everything else goes through Next.
const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || "/";
    if (req.method === "GET" || req.method === "HEAD") {
      const cleanPath = url.split("?")[0];
      // Reject traversal attempts before touching the filesystem.
      if (!cleanPath.includes("..")) {
        const candidate = path.join(PUBLIC_DIR, cleanPath);
        if (
          candidate.startsWith(PUBLIC_DIR + path.sep) &&
          fs.existsSync(candidate) &&
          fs.statSync(candidate).isFile()
        ) {
          const ext = path.extname(candidate).toLowerCase();
          const type = MIME[ext] ?? "application/octet-stream";
          const body = await fsp.readFile(candidate);
          res.writeHead(200, {
            "content-type": type,
            "content-length": body.length,
            "cache-control": "public, max-age=86400",
          });
          if (req.method === "HEAD") {
            res.end();
          } else {
            res.end(body);
          }
          return;
        }
      }
    }
    await handleNext(req, res);
  } catch (err) {
    console.error("[lambda] request handler error", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("internal server error");
    } else {
      res.end();
    }
  }
});

const wrapped = serverless(server, {
  binary: [
    "image/*",
    "video/*",
    "audio/*",
    "font/*",
    "application/pdf",
    "application/zip",
    "application/octet-stream",
  ],
});

exports.handler = async (event, context) => {
  // Don't wait for fire-and-forget tasks (e.g. /api/evaluate/[id]) to
  // drain the event loop before returning the response — they continue
  // running until the Lambda timeout (set generously in Terraform).
  context.callbackWaitsForEmptyEventLoop = false;
  return wrapped(event, context);
};
