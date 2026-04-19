/** @type {import('next').NextConfig} */
// Static export uses absolute URLs like `/_next/static/...`. Those only work over **http(s)** from the
// site root, OR when `basePath` matches a subfolder deploy (e.g. `/store`). See DEPLOYMENT_HOSTINGER.md.

const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
const basePath = rawBase.replace(/\/$/, '') || undefined

const nextConfig = {
  output: 'export',
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
