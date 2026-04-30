/**
 * After `NEXT_STATIC_EXPORT=true next build`, writes `out/_next/.htaccess`.
 * Next.js forbids `public/_next/` (conflicts with internal route), so this runs post-build.
 * Helps Hostinger/LiteSpeed stacks that return 400 on `/_next/static/*` chunk URLs.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const cwd = process.cwd()
const nextDir = join(cwd, 'out', '_next')

if (!existsSync(nextDir)) {
  process.exit(0)
}

const htaccess = `# Next.js static export — /_next/static/*
# Some Hostinger/LiteSpeed setups return 400 for hashed chunk URLs (ModSecurity / rewrites).

<IfModule mod_rewrite.c>
  RewriteEngine Off
</IfModule>

<IfModule mod_security2.c>
  SecRuleEngine Off
</IfModule>
<IfModule security2_module.c>
  SecRuleEngine Off
</IfModule>
`

mkdirSync(nextDir, { recursive: true })
writeFileSync(join(nextDir, '.htaccess'), htaccess)
console.log('[write-next-htaccess] wrote out/_next/.htaccess')
