const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/gh/faker-js/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/queues/:path*',
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/queues/:path*`,
        locale: false,
      },
    ];
  }
};

module.exports = withNextIntl(nextConfig);