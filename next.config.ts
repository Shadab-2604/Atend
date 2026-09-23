import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["mongoose", "bcryptjs"]
};

export default nextConfig;
