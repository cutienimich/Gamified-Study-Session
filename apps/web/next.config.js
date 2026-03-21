/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['graph.facebook.com', 'platform-lookaside.fbsbx.com', 'kskmyjptmfvyzcqcsusg.supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}
module.exports = nextConfig