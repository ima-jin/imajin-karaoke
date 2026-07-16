/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@imajin/db'], // @imajin/db ships raw TS via file: dep; Next must transpile it
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
