/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  },
  experimental: {
    allowedDevOrigins: ['localhost:3000', '172.20.10.2:3000', '1492-197-210-77-187.ngrok-free.app']
  }
};

module.exports = nextConfig;
