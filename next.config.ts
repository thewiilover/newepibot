import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  webpack: (config) => {
    config.externals.push({
      "zlib-sync": "commonjs zlib-sync",
    });
    return config;
  },
};

export default nextConfig;