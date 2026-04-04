import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack scoped to this app so workspace-level lockfiles do not trigger warnings.
    root: __dirname,
  },
};

export default nextConfig;
