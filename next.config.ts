import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle at .next/standalone for the
  // Lambda zip — see lambda/index.cjs and .github/workflows/deploy.yml.
  output: "standalone",
  // Disable Next's response compression. The Lambda handler is a proxy
  // that forwards raw bytes back to API Gateway; if Next gzips, we'd
  // have to special-case content-encoding on the way out or the browser
  // gets garbage (ERR_CONTENT_DECODING_FAILED). CloudFront does
  // content-aware compression on its own based on Accept-Encoding.
  compress: false,
};

export default nextConfig;
