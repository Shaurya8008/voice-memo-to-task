/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable app directory and typescript paths
    appDir: true,
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig