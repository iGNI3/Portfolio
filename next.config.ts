import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The chat route reads this file at runtime; make sure Vercel bundles it
  // with the serverless function instead of relying on automatic tracing.
  outputFileTracingIncludes: {
    "/api/chat": ["./src/content/knowledge.md"],
  },
};

export default nextConfig;
