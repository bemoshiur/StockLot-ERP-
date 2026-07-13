import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the app can run
  // from a small Docker image without the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
