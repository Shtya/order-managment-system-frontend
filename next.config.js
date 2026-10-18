const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
  },
  async headers() {
    const frameDeny = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    ];
    return [
      { source: "/mcp/connect", headers: frameDeny },
      { source: "/:locale/mcp/connect", headers: frameDeny },
      { source: "/auth", headers: frameDeny },
      { source: "/auth/:path*", headers: frameDeny },
      { source: "/:locale/auth", headers: frameDeny },
      { source: "/:locale/auth/:path*", headers: frameDeny },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
