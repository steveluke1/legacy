import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;