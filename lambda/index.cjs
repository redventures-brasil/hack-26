/* eslint-disable @typescript-eslint/no-require-imports */
// AWS Lambda handler for the hack-26 Next.js app.
//
// Layout when packaged: this file sits at the root of the Lambda zip,
// alongside the `next build --output=standalone` output (server.js,
// node_modules/, .next/, public/, package.json). The CI workflow assembles
// that layout in .github/workflows/deploy.yml.

const http = require("node:http");
const path = require("node:path");
const serverless = require("serverless-http");

// Force Next into nodejs runtime and skip telemetry / lint phases.
process.env.NEXT_RUNTIME = "nodejs";
process.env.NEXT_TELEMETRY_DISABLED = "1";

// Standalone-emitted manifest with the resolved next.config at build time.
const required = require(path.join(__dirname, ".next/required-server-files.json"));

// NextServer comes from the bundled `next` package inside the standalone
// node_modules. The default export is the Node.js server class.
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

const handle = nextServer.getRequestHandler();

const server = http.createServer((req, res) => {
  Promise.resolve(handle(req, res)).catch((err) => {
    console.error("[lambda] request handler error", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("internal server error");
    } else {
      res.end();
    }
  });
});

const wrapped = serverless(server, {
  binary: [
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
    "application/zip",
    "application/octet-stream",
    "font/*",
  ],
});

exports.handler = async (event, context) => {
  // Don't wait for fire-and-forget tasks (e.g. /api/evaluate/[id]) to
  // drain the event loop before returning the response — they continue
  // running until the Lambda timeout (set generously in Terraform).
  context.callbackWaitsForEmptyEventLoop = false;
  return wrapped(event, context);
};
