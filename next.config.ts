import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: true, 
  },
  webpack: (config) => {
    config.output = {
      ...config.output,
      chunkLoadTimeout: 60000, 
    };
    return config;
  },
};

export default nextConfig;