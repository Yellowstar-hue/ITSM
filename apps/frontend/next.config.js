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
    // BACKEND_URL is a server-only runtime env var (not baked at build time).
    // NEXT_PUBLIC_API_URL is the fallback (may be baked in at build time).
    // Set BACKEND_URL in Railway frontend service env vars to the API service URL.
    const apiOrigin =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://simplenowapi-production.up.railway.app'
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
