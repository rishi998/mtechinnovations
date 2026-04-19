import path from 'path'
import { fileURLToPath } from 'url'

/** @type {import('next').NextConfig} */
// Static export uses absolute URLs like `/_next/static/...`. Those only work over **http(s)** from the
// site root, OR when `basePath` matches a subfolder deploy (e.g. `/store`). See DEPLOYMENT_HOSTINGER.md.

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
const basePath = rawBase.replace(/\/$/, '') || undefined

// Only enable static export for production builds. With `output: 'export'`, `next dev` can intermittently
// fail (e.g. missing `.next/routes-manifest.json`) because the dev server and export pipelines differ.
const isProdBuild = process.env.NODE_ENV === 'production'

const nextConfig = {
  // Pin tracing to this app so a parent monorepo lockfile does not confuse Next.js.
  outputFileTracingRoot: path.join(__dirname),
  ...(isProdBuild ? { output: 'export' } : {}),
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
  images: {
    unoptimized: true, // required for static export (no Node.js image optimization)
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
}

export default nextConfig
