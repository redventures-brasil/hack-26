import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle at .next/standalone for the
  // Lambda zip — see lambda/index.cjs and .github/workflows/deploy.yml.
  output: "standalone",
};

export default nextConfig;
