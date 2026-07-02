/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    serverComponentsExternalPackages: ['@pdf-lib/fontkit', 'pdfkit'],
  },
  // Increase API route body size limit
  async headers() {
    return [
      {
        source: '/v/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/localizer', destination: '/', permanent: true },
      { source: '/tourrouter', destination: '/coming-soon', permanent: false },
      { source: '/diy', destination: '/coming-soon', permanent: false },
      { source: '/roadapp', destination: '/coming-soon', permanent: false },
    ];
  },
};

// Patch the body size limit for API routes
process.env.NEXT_BODY_SIZE_LIMIT = '20971520'; // 20mb in bytes

module.exports = nextConfig;
