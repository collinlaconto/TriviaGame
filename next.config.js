/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig