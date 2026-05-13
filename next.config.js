/** @type {import('next').NextConfig} */
const nextConfig = {
  // transpilePackages: ['@imajin/ui', '@imajin/db'], // Disabled for standalone microsite
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.imajin.ai',
      },
    ],
  },
};

module.exports = nextConfig;
