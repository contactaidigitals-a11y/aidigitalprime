import type { NextConfig } from "next";

// Keep the existing Next/Vinext app and all previous routes.
// Only the homepage serves the new static AI Digital Prime storefront.
const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/prime/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
