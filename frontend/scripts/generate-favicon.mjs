/**
 * Builds app/icon.png and app/apple-icon.png: logo centered on solid black,
 * scaled large for clearer small-tab visibility.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const logoPath = path.join(root, 'public/images/logo.png')

/** Logo occupies this fraction of the canvas (max edge); higher = larger mark in the tab. */
const LOGO_RATIO = 0.92

async function writeIcon(outRelative, canvasSize) {
  const maxLogo = Math.round(canvasSize * LOGO_RATIO)
  const logoBuf = await sharp(logoPath).resize(maxLogo, maxLogo, { fit: 'inside' }).ensureAlpha().toBuffer()

  const { width: lw = 0, height: lh = 0 } = await sharp(logoBuf).metadata()
  const left = Math.round((canvasSize - lw) / 2)
  const top = Math.round((canvasSize - lh) / 2)

  const outPath = path.join(root, outRelative)

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toFile(outPath)

  console.log('Wrote', outPath)
}

await writeIcon('app/icon.png', 512)
await writeIcon('app/apple-icon.png', 180)
