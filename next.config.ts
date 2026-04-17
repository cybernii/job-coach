import type { NextConfig } from "next";

// BUILD_FOR_AWS=true → static export for S3/CloudFront (Parts 2-4)
// Otherwise          → normal Vercel SSR build (Part 1)
const isAwsBuild = process.env.BUILD_FOR_AWS === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isAwsBuild && {
    output: 'export',
    images: { unoptimized: true },
  }),
};

export default nextConfig;
