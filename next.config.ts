import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@anthropic-ai/sdk", "@supabase/supabase-js", "openai"],
  },
};

export default nextConfig;
