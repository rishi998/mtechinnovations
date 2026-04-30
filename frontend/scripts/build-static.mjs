/**
 * Static export for Hostinger (sets NEXT_STATIC_EXPORT so `out/` is produced).
 * Run from `frontend`: `npm run build:static`
 *
 * Uses shell:false so paths with spaces (e.g. C:\Users\Rishi Mahto\...) work on Windows.
 */
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = dirname(fileURLToPath(import.meta.url))
const cwd = join(root, '..')
const env = { ...process.env, NEXT_STATIC_EXPORT: 'true' }

const nextBin = join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next')

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: false,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

if (!existsSync(nextBin)) {
  console.error('[build:static] Next CLI missing. Run npm install in frontend/')
  process.exit(1)
}

run(process.execPath, [nextBin, 'build'])
run(process.execPath, [join(root, 'write-next-htaccess.mjs')])
run(process.execPath, [join(root, 'hostinger-patch-export.mjs')])
console.log('[build:static] done — upload everything inside frontend/out/')
