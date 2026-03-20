/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'ui-avatars.com'],
  },
  async rewrites() {
    // API runs in the same container on port 3001.
    // BACKEND_URL can override for standalone API deployments.
    const apiOrigin = process.env.BACKEND_URL || 'http://localhost:3001'
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
