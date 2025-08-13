/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ik.imagekit.io'],
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io', pathname: '/tzublgy5d/**' },
    ],
  },
  async redirects() {
    const redirects = [
      { source: '/about', destination: '/about-us', permanent: true },
    ];

    if (!process.env.DIAG_TOKEN) {
      redirects.push({
        source: '/api/leaderboard/diag',
        destination: '/404',
        permanent: false,
      });
    }

    return redirects;
  },
  // ... other configurations you might have
};

module.exports = nextConfig;
  