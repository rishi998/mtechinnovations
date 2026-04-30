import { appendFileSync } from 'fs'
import { join } from 'path'
import type { Category, Product } from '@/lib/types'
import { getPublicApiUrl } from '@/lib/env/publicApi'
import {
  PLACEHOLDER_IMAGE,
  mapServerProductDoc,
  resolveCatalogImageUrl,
  slugifyCatalogLabel,
} from './catalog'

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

/**
 * Live Zoho categories during `next build` (for `generateStaticParams` so we
 * pre-render every Zoho item-group slug, even those without synced products).
 * Returns [] on any failure — caller already unions with derived categories.
 */
export async function fetchZohoCategoriesForBuild(): Promise<Category[]> {
  const base = getPublicApiUrl().replace(/\/$/, '')
  const url = `${base}/zoho/products/categories`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const json: unknown = await res.json()
    if (!json || typeof json !== 'object') return []
    const data = (json as { data?: unknown }).data
    if (!Array.isArray(data)) return []
    return data
      .filter(
        (row): row is Record<string, unknown> =>
          row != null && typeof row === 'object',
      )
      .map((row) => {
        const name = String(row.name ?? '').trim()
        const slug = String(row.slug ?? slugifyCatalogLabel(name || 'uncategorized'))
        const rawImage = row.image
        const image =
          typeof rawImage === 'string' && rawImage.trim()
            ? resolveCatalogImageUrl(rawImage)
            : PLACEHOLDER_IMAGE
        return {
          id: String(row.id ?? slug),
          name: name || slug,
          slug,
          image,
          productCount: Number(row.productCount ?? 0),
          subcategories: [] as string[],
        }
      })
  } catch {
    return []
  }
}
