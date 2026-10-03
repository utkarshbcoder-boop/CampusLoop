import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Lint is run explicitly via `npm run lint`; keeping it out of build makes
    // `npm run build` focused on compilation.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
