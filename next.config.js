const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'external-content.duckduckgo.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/r/:code",
          destination: "/register?ref=:code",
        },
        {
          source: "/en/r/:code",
          destination: "/en/register?ref=:code",
        },
        {
          source: "/hi/r/:code",
          destination: "/hi/register?ref=:code",
        },
      ],
    };
  },
}

module.exports = withNextIntl(nextConfig);