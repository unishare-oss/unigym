import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The API behind the web origin: the browser only talks to this host.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
