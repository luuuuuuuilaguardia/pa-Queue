/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://pa-queue-server.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
