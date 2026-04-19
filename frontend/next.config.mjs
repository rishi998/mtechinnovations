import path from 'path'
import { fileURLToPath } from 'url'

/** @type {import('next').NextConfig} */
// Static export: set NEXT_STATIC_EXPORT=true when you need `out/` for static hosts (e.g. Hostinger).
// Render uses `next start` — leave NEXT_STATIC_EXPORT unset (default).

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
const basePath = rawBase.replace(/\/$/, '') || undefined

const staticExport = process.env.NEXT_STATIC_EXPORT === 'true'

const nextConfig = {
  reactStrictMode: true,
  // Pin tracing to this app so a parent monorepo lockfile does not confuse Next.js.
  outputFileTracingRoot: path.join(__dirname),
  ...(staticExport ? { output: 'export' } : {}),
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
}

export default nextConfig
