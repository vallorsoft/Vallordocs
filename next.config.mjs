import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone output produces a minimal server bundle for the Fly.io Docker image.
  output: 'standalone',
  experimental: {
    // Server Actions are used across modules; keep the body limit generous for uploads.
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default withNextIntl(nextConfig);
