import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: true, // Enable ES modules
  },
};

export default nextConfig;
