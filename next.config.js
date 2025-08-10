/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['ik.imagekit.io'],
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value:
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js-eu1.hsforms.net; frame-src https://forms-eu1.hsforms.com https://share.hsforms.com; img-src 'self' data: https://forms.hsforms.com https://forms-eu1.hsforms.com; style-src 'self' 'unsafe-inline'; connect-src 'self';",
            },
          ],
        },
      ];
    },
    // ... other configurations you might have
  };
  
  module.exports = nextConfig;

