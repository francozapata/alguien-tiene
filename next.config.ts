import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.154",
    "http://192.168.0.154:3000",
  ],
};

export default nextConfig;
