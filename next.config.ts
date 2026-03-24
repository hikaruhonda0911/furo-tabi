import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.rakuten.co.jp',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com blob:",
            "style-src 'self' 'unsafe-inline' https://*.googleapis.com",
            "font-src 'self' https://*.gstatic.com",
            "img-src 'self' data: blob: https://*.rakuten.co.jp https://*.googleusercontent.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://*.google.com https://www.googletagmanager.com",
            "connect-src 'self' https://*.rakuten.co.jp https://*.supabase.co https://*.googleapis.com https://*.google.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
            "frame-src https://www.googletagmanager.com",
            "worker-src blob:",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;
