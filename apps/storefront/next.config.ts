import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const vendureAssets = new URL(process.env.VENDURE_ASSET_URL ?? 'http://localhost:3000/assets/')

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ['@karcher/graphql', '@karcher/seo', '@karcher/ui'],
  images: {
    // Next.js refuses to optimize images from private IPs; allow it only for a local Vendure in dev.
    dangerouslyAllowLocalIP: ['localhost', '127.0.0.1'].includes(vendureAssets.hostname),
    localPatterns: [{ pathname: '/api/media/file/**' }],
    remotePatterns: [
      {
        protocol: vendureAssets.protocol.replace(':', '') as 'http' | 'https',
        hostname: vendureAssets.hostname,
        port: vendureAssets.port,
        pathname: `${vendureAssets.pathname}**`,
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    // pnpm workspace root, so Turbopack resolves the shared packages
    root: path.resolve(dirname, '../..'),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
