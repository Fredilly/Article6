/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ik.imagekit.io'],
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io', pathname: '/tzublgy5d/**' },
    ],
  },
  async redirects() {
    return [
      { source: '/about', destination: '/about-us', permanent: true },
    ];
  },
  // ... other configurations you might have
};

module.exports = nextConfig;
  