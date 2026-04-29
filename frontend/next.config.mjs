import path from 'path'
import { fileURLToPath } from 'url'

/** @type {import('next').NextConfig} */
// Static export: set NEXT_STATIC_EXPORT=true when you need `out/` for static hosts (e.g. Hostinger).
// Render uses `next start` — leave NEXT_STATIC_EXPORT unset (default).

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
const basePath = rawBase.replace(/\/$/, '') || undefined

const staticExport = process.env.NEXT_STATIC_EXPORT === 'true'

/** Allow `next/image` to load Zoho proxy URLs served under your API host (from NEXT_PUBLIC_API_URL). */
function apiImageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!raw) return []
  try {
    const u = new URL(raw)
    const pattern = {
      protocol: u.protocol.replace(/:$/, '') || 'https',
      hostname: u.hostname,
      pathname: '/api/**',
    }
    if (u.port) {
      pattern.port = u.port
    }
    return [pattern]
  } catch {
    return []
  }
}

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
      ...apiImageRemotePatterns(),
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
