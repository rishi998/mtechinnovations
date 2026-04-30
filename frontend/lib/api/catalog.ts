import type { Product, Category } from '@/lib/types'
import { getPublicApiUrl } from '@/lib/env/publicApi'
import { api } from './client'

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800'

/**
 * Nest mounts Zoho routes under `/api/zoho/...`. Production builds sometimes omit `/api`
 * from `NEXT_PUBLIC_API_URL`; URLs become `https://domain/zoho/...` and static hosts 404.
 * Normalize absolute URLs that point at `/zoho/` without `/api/zoho/`.
 */
function injectApiBeforeZohoIfMissing(absUrl: string): string {
  if (!/^https?:\/\//i.test(absUrl)) return absUrl
  if (!absUrl.includes('/zoho/') || absUrl.includes('/api/zoho/')) return absUrl
  try {
    const u = new URL(absUrl)
    if (u.pathname.startsWith('/zoho/')) {
      u.pathname = '/api' + u.pathname
      return u.toString()
    }
  } catch {
    /* ignore */
  }
  return absUrl.replace(/^(https?:\/\/[^/]+)\/(zoho\/)/i, '$1/api/$2')
}

let _dbgZohoResolveLogs = 0;

/** Turn API-relative paths (e.g. `/zoho/items/…/image`) into absolute URLs for `<Image src>`. */
export function resolveCatalogImageUrl(url: string): string {
  const t = url.trim()
  if (!t) return PLACEHOLDER_IMAGE

  let out: string
  const isAbsHttp = /^https?:\/\//i.test(t)
  const protoRel = t.startsWith('//')
  if (isAbsHttp) {
    out = t
  } else {
    const apiBase = getPublicApiUrl().replace(/\/$/, '')
    out = t.startsWith('/') ? `${apiBase}${t}` : `${apiBase}/${t.replace(/^\//, '')}`
  }

  const final = injectApiBeforeZohoIfMissing(out)
  // #region agent log
  if (
    (t.includes('zoho') || final.includes('zoho')) &&
    _dbgZohoResolveLogs < 30
  ) {
    _dbgZohoResolveLogs += 1;
    fetch('http://127.0.0.1:7681/ingest/2a46f5dd-d7d2-453e-bd45-dce3655ab643', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'ae2d28',
      },
      body: JSON.stringify({
        sessionId: 'ae2d28',
        runId: 'pre-fix',
        hypothesisId: 'H2-H3',
        location: 'catalog.ts:resolveCatalogImageUrl',
        message: 'catalog image resolve',
        data: {
          isAbsHttp,
          protoRel,
          injectChanged: final !== out,
          hasApiZoho: final.includes('/api/zoho/'),
          inSample: t.slice(0, 140),
          finalSample: final.slice(0, 140),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return final
}

/** First non-empty image URL, or catalog placeholder (safe for Next/Image `src`). */
export function firstProductImageUrl(images?: string[] | null): string {
  const first = images?.find((u) => typeof u === 'string' && u.trim().length > 0)
  return first ? resolveCatalogImageUrl(first.trim()) : PLACEHOLDER_IMAGE
}

export function slugifyCatalogLabel(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'uncategorized'
  )
}

let _dbgMapDocLogs = 0;

/** Map Nest/Mongoose product JSON to storefront Product. */
export function mapServerProductDoc(doc: Record<string, unknown>): Product {
  const id = String(doc._id ?? doc.id ?? '')
  const imagesRaw = doc.images
  let images: string[]
  if (Array.isArray(imagesRaw) && imagesRaw.length > 0) {
    // #region agent log
    if (_dbgMapDocLogs < 8) {
      const firstRaw =
        (imagesRaw as unknown[]).find((u) => typeof u === 'string') ?? '';
      if (typeof firstRaw === 'string' && firstRaw.includes('zoho')) {
        _dbgMapDocLogs += 1;
        fetch(
          'http://127.0.0.1:7681/ingest/2a46f5dd-d7d2-453e-bd45-dce3655ab643',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Session-Id': 'ae2d28',
            },
            body: JSON.stringify({
              sessionId: 'ae2d28',
              runId: 'pre-fix',
              hypothesisId: 'H4',
              location: 'catalog.ts:mapServerProductDoc',
              message: 'raw product images from API',
              data: {
                firstRawSample: firstRaw.slice(0, 140),
                looksAbsolute: /^https?:\/\//i.test(firstRaw),
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
      }
    }
    // #endregion
    images = (imagesRaw as string[])
      .filter((u) => typeof u === 'string' && u.length > 0)
      .map((u) => resolveCatalogImageUrl(u))
    if (images.length === 0) images = [PLACEHOLDER_IMAGE]
  } else {
    images = [PLACEHOLDER_IMAGE]
  }
  return {
    id,
    name: String(doc.name ?? ''),
    slug: String(doc.slug ?? ''),
    sku: doc.sku != null && doc.sku !== '' ? String(doc.sku) : undefined,
    zohoImageId:
      doc.zoho_image_id != null && String(doc.zoho_image_id).trim() !== ''
        ? String(doc.zoho_image_id).trim()
        : null,
    category: String(doc.category ?? 'Uncategorized'),
    subcategory: String(doc.subcategory ?? ''),
    price: Number(doc.price ?? 0),
    originalPrice:
      doc.originalPrice != null ? Number(doc.originalPrice) : undefined,
    discount: doc.discount != null ? Number(doc.discount) : undefined,
    images,
    rating: Number(doc.rating ?? 0),
    reviewsCount: Number(doc.reviewsCount ?? 0),
    stock: Number(doc.stock ?? 0),
    description: String(doc.description ?? ''),
    specs: (doc.specs as Record<string, string>) ?? {},
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    brand: String(doc.brand ?? 'Zoho'),
    featured: Boolean(doc.featured),
    trending: Boolean(doc.trending),
    dealOfDay: Boolean(doc.dealOfDay),
    isNewLaunch: Boolean(doc.isNewLaunch),
  }
}

export function deriveCategoriesFromProducts(products: Product[]): Category[] {
  const counts = new Map<string, number>()
  for (const p of products) {
    const c = p.category?.trim() || 'Uncategorized'
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, productCount]) => {
      const slug = slugifyCatalogLabel(name)
      return {
        id: slug,
        name,
        slug,
        image: PLACEHOLDER_IMAGE,
        productCount,
        subcategories: [] as string[],
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getProducts(): Promise<Product[]> {
  const data = await api.get<Record<string, unknown>[]>('/products')
  if (!Array.isArray(data)) return []
  return data.map((row) => mapServerProductDoc(row))
}

export async function getProductBySlugOrId(ref: string): Promise<Product | null> {
  try {
    const doc = await api.get<Record<string, unknown>>(
      `/products/${encodeURIComponent(ref)}`,
    )
    return mapServerProductDoc(doc)
  } catch {
    return null
  }
}

/** For `generateStaticParams` during `next build` (Node). */
export async function fetchProductsListForBuild(): Promise<Product[]> {
  const base = getPublicApiUrl()
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/products`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((row) =>
      mapServerProductDoc(row as Record<string, unknown>),
    )
  } catch {
    return []
  }
}
