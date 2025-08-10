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
                "default-src 'self'; script-src 'self' https://js-eu1.hsforms.net; frame-src 'self' https://forms-eu1.hsforms.com https://share.hsforms.com; img-src 'self' https://forms-eu1.hsforms.com https://forms.hsforms.com data:; style-src 'self' 'unsafe-inline' https://forms-eu1.hsforms.com https://forms.hsforms.com; connect-src 'self';",
            },
          ],
        },
      ];
    },
    // ... other configurations you might have
  };
  
  module.exports = nextConfig;

