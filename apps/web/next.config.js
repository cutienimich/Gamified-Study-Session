/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com',
      'kskmyjptmfvyzcqcsusg.supabase.co',
      'lh3.googleusercontent.com',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}
module.exports = nextConfig