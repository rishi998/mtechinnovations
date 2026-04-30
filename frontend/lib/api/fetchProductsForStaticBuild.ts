import { appendFileSync } from 'fs'
import { join } from 'path'
import type { Product } from '@/lib/types'
import { getPublicApiUrl } from '@/lib/env/publicApi'
import { mapServerProductDoc } from './catalog'

/** Repo-root NDJSON log for debug session (works during `next build` on dev machine). */
function agentDbg(payload: Record<string, unknown>) {
  try {
    const cwd = process.cwd()
    const root = cwd.endsWith('frontend') ? join(cwd, '..') : cwd
    appendFileSync(
      join(root, 'debug-ae2d28.log'),
      `${JSON.stringify({
        sessionId: 'ae2d28',
        timestamp: Date.now(),
        runId: 'pre-fix',
        ...payload,
      })}\n`,
    )
  } catch {
    /* ignore */
  }
}

/** For `generateStaticParams` during `next build` (Node only — uses `fs` for debug NDJSON). */
export async function fetchProductsListForBuild(): Promise<Product[]> {
  const base = getPublicApiUrl()
  const url = `${base.replace(/\/$/, '')}/products`
  agentDbg({
    hypothesisId: 'H7',
    location: 'fetchProductsForStaticBuild:start',
    message: 'static build fetch products',
    data: { base, url },
  })
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      agentDbg({
        hypothesisId: 'H7',
        location: 'fetchProductsForStaticBuild',
        message: 'products response not ok',
        data: { status: res.status, statusText: res.statusText },
      })
      return []
    }
    const data: unknown = await res.json()
    if (!Array.isArray(data)) {
      agentDbg({
        hypothesisId: 'H7',
        location: 'fetchProductsForStaticBuild',
        message: 'products json not array',
        data: { jsonType: typeof data },
      })
      return []
    }
    const products = data.map((row) =>
      mapServerProductDoc(row as Record<string, unknown>),
    )
    const first = products[0]
    agentDbg({
      hypothesisId: 'H7',
      location: 'fetchProductsForStaticBuild',
      message: 'products mapped for static build',
      data: {
        count: products.length,
        firstImageSample: first?.images?.[0]?.slice(0, 180) ?? null,
        firstHasApiZoho: Boolean(first?.images?.[0]?.includes('/api/zoho/')),
      },
    })
    return products
  } catch (e) {
    agentDbg({
      hypothesisId: 'H7',
      location: 'fetchProductsForStaticBuild',
      message: 'products fetch threw',
      data: { error: String(e) },
    })
    return []
  }
}
