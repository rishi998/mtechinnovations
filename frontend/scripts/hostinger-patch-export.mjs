/**
 * Hostinger / LiteSpeed often returns 400 for `/_next/static/*`, which breaks navigation
 * (e.g. ChunkLoadError on `/checkout/` when lazy chunks fail to load).
 *
 * After static export, renames `out/_next` → `out/nx` and rewrites `/_next/` → `/nx/` in text assets.
 *
 * Runs automatically whenever `out/_next` exists after build.
 * Opt out (keep `_next`): HOSTINGER_PATCH_EXPORT=false
 *
 * Optional folder name: NEXT_STATIC_ASSETS_DIR=mycdn
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'fs'
import { extname, join } from 'path'

const cwd = process.cwd()
const outDir = join(cwd, 'out')

const explicitDisable =
  process.env.HOSTINGER_PATCH_EXPORT === 'false' ||
  process.env.HOSTINGER_PATCH_EXPORT === '0'

if (explicitDisable || !existsSync(outDir)) {
  process.exit(0)
}

const oldDir = join(outDir, '_next')
const dirName = (process.env.NEXT_STATIC_ASSETS_DIR || 'nx').replace(
  /^\/+|\/+$/g,
  '',
)
const newDir = join(outDir, dirName)

if (!existsSync(oldDir)) {
  process.exit(0)
}

if (existsSync(newDir)) {
  console.error(
    `[hostinger-patch] out/${dirName} already exists — remove it or set NEXT_STATIC_ASSETS_DIR`,
  )
  process.exit(1)
}

renameSync(oldDir, newDir)
console.log(`[hostinger-patch] renamed _next → ${dirName} (Hostinger-safe static paths)`)

const TEXT_EXT = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.css',
  '.txt',
  '.json',
  '.map',
])

function patchString(s) {
  let out = s
  const to = `/${dirName}/`
  out = out.replaceAll('/_next/', to)
  out = out.replaceAll('\\/_next\\/', `\\/${dirName}\\/`)
  return out
}

function walk(absDir) {
  for (const name of readdirSync(absDir)) {
    const p = join(absDir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      walk(p)
      continue
    }
    const ext = extname(name).toLowerCase()
    if (!TEXT_EXT.has(ext)) continue
    const raw = readFileSync(p, 'utf8')
    const next = patchString(raw)
    if (next !== raw) writeFileSync(p, next)
  }
}

walk(outDir)
console.log(`[hostinger-patch] rewrote /_next/ → /${dirName}/ under out/`)
