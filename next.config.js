/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/MedSense_Dashboard',
        destination: '/medsense_dashboard',
        permanent: false,
      },
      {
        source: '/MedSense_Dashboard/:path*',
        destination: '/medsense_dashboard/:path*',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig
