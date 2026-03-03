const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
	output : "standalone",
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/gh/faker-js/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
