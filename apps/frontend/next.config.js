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
    // BACKEND_URL: runtime override (set in Railway frontend service variables).
    // NEXT_PUBLIC_API_URL: also works as fallback (declared as ARG in Dockerfile).
    // Default: same-container NestJS on port 3001 (local dev / combined deployment).
    const apiOrigin = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
