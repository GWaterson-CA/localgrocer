/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors during build
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), '@prisma/client'];
    return config;
  },
}

module.exports = nextConfig 