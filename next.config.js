/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    serverComponentsExternalPackages: ['@pdf-lib/fontkit'],
  },
  // Increase API route body size limit
  async headers() {
    return [];
  },
};

// Patch the body size limit for API routes
process.env.NEXT_BODY_SIZE_LIMIT = '20971520'; // 20mb in bytes

module.exports = nextConfig;
