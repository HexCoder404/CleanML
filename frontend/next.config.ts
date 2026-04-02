import type { NextConfig } from "next";

// In production (Vercel), set NEXT_PUBLIC_API_URL=https://cleanml.onrender.com
// In local dev, falls back to http://localhost:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
