import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@ws/slides-schema'],
  agentRules: false,
}

export default nextConfig
