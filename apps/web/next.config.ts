import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/health",
        destination: "http://localhost:3001/health",
      },
    ];
  },
};

export default nextConfig;
