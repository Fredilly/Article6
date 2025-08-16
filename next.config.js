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
      {
        source: '/states/:slug',
        destination: '/projects/nigeria/states/:slug',
        permanent: true,
      },
      {
        source: '/states/:slug/facts',
        destination: '/projects/nigeria/states/:slug/facts',
        permanent: true,
      },
      {
        source: '/country',
        destination: '/projects/nigeria',
        permanent: true,
      },
    ];
  },
  // ... other configurations you might have
};

module.exports = nextConfig;
  