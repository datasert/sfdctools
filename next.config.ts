import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for better Chrome extension compatibility
  trailingSlash: false,
  // Disable source maps in production for smaller bundle
  productionBrowserSourceMaps: false,
  // Disable dynamic imports that could violate Chrome extension CSP
  experimental: {
    optimizePackageImports: ['monaco-editor', '@monaco-editor/react'],
  },
  // Configure Turbopack (Next.js 16 default)
  turbopack: {},
  // Ensure all code is bundled (no dynamic code loading)
  // Using webpack for build (Turbopack is for dev)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent dynamic imports in client bundle
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
    return config;
  },
};

export default nextConfig;
