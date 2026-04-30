import type { Product, Category } from '@/lib/types'
import { getPublicApiUrl } from '@/lib/env/publicApi'
import { api } from './client'

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800'

/**
 * Nest mounts Zoho routes under `/api/zoho/...`. Production builds sometimes omit `/api`
 * from `NEXT_PUBLIC_API_URL`; URLs become `https://domain/zoho/...` and static hosts 404.
 * Normalize absolute URLs that point at `/zoho/` without `/api/zoho/`.
 *
 * Root-relative `/zoho/*` or `/api/zoho/*` (no origin) resolves against the site host on
 * static export → Apache 404. Prefix with `NEXT_PUBLIC_API_URL` origin so images hit Nest.
 */
function injectApiBeforeZohoIfMissing(absUrl: string): string {
  if (absUrl.startsWith('/api/zoho/')) {
    const base = getPublicApiUrl().replace(/\/$/, '')
    if (/^https?:\/\//i.test(base)) {
      try {
        absUrl = `${new URL(base).origin}${absUrl}`
      } catch {
        /* keep absUrl */
      }
    } else if (typeof window !== 'undefined') {
      absUrl = `${window.location.origin}${absUrl}`
    }
  }
  if (absUrl.startsWith('/zoho/')) {
    const base = getPublicApiUrl().replace(/\/$/, '')
    if (/^https?:\/\//i.test(base)) {
      absUrl = `${base}${absUrl}`
    } else if (typeof window !== 'undefined') {
      const prefix = base.startsWith('/') ? base : `/${base}`
      absUrl = `${window.location.origin}${prefix}${absUrl}`
    } else {
      absUrl = `${base}${absUrl}`
    }
  }

  // Absolute URL with path /zoho/... but no /api/zoho/ (case-insensitive).
  if (
    /^https?:\/\//i.test(absUrl) &&
    /\/zoho\//i.test(absUrl) &&
    !/\/api\/zoho\//i.test(absUrl)
  ) {
    absUrl = absUrl.replace(/^(https?:\/\/[^/]+)\/(zoho\/)/i, '$1/api/$2')
  }

  if (!/^https?:\/\//i.test(absUrl)) return absUrl
  if (!/\/zoho\//i.test(absUrl) || /\/api\/zoho\//i.test(absUrl)) return absUrl
  try {
    const u = new URL(absUrl)
    if (/^\/zoho\//i.test(u.pathname)) {
      u.pathname = '/api' + u.pathname
      return u.toString()
    }
  } catch {
    /* ignore */
  }
  return absUrl.replace(/^(https?:\/\/[^/]+)\/(zoho\/)/i, '$1/api/$2')
}

/** Turn API-relative paths (e.g. `/zoho/items/…/image`) into absolute URLs for `<Image src>`. */
export function resolveCatalogImageUrl(url: string): string {
  let t = url.trim()
  if (!t) return PLACEHOLDER_IMAGE

  // Protocol-relative URLs (//host/...)
  if (t.startsWith('//')) {
    t = `https:${t}`
  }

  // Stored paths are relative to Nest `/api`; `/zoho/...` alone hits the static host as `/zoho` → 404.
  if (/^\/zoho\//i.test(t) && !/^\/api\/zoho\//i.test(t)) {
    t = `/api${t}`
  }

  const apiBase = getPublicApiUrl().replace(/\/$/, '')
  const isAbsHttp = /^https?:\/\//i.test(t)

  let out: string
  if (isAbsHttp) {
    out = t
  } else if (/^\/api\/zoho\//i.test(t)) {
    try {
      const origin = new URL(
        apiBase.includes('://') ? apiBase : `https://${apiBase}`,
      ).origin
      out = `${origin}${t}`
    } catch {
      out = `${apiBase}${t.replace(/^\/api/, '') || '/'}`
    }
  } else {
    out = t.startsWith('/')
      ? `${apiBase}${t}`
      : `${apiBase}/${t.replace(/^\//, '')}`
  }

  return injectApiBeforeZohoIfMissing(out)
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

/** Map Nest/Mongoose product JSON to storefront Product. */
export function mapServerProductDoc(doc: Record<string, unknown>): Product {
  const id = String(doc._id ?? doc.id ?? '')
  const imagesRaw = doc.images
  let images: string[]
  if (Array.isArray(imagesRaw) && imagesRaw.length > 0) {
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
    categoryHints: Array.isArray(doc.category_hints)
      ? (doc.category_hints as unknown[])
          .filter((x) => typeof x === 'string' && x.trim().length > 0)
          .map((x) => String(x).trim())
      : [],
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

/** Row shape returned by GET /api/zoho/products/categories. */
interface ZohoCategoryApiRow {
  id?: string | number
  name?: string
  slug?: string
  description?: string
  productCount?: number
  source?: 'group' | 'item'
  image?: string | null
}

/**
 * Live Zoho Inventory categories (item groups + items aggregated server-side).
 * Returns [] on network/Zoho failures so the storefront can fall back to
 * the categories `deriveCategoriesFromProducts` derives from the cached
 * `/api/products` payload.
 */
export async function getZohoCategories(): Promise<Category[]> {
  try {
    const res = await api.get<{
      success: boolean
      data: ZohoCategoryApiRow[]
    }>('/zoho/products/categories')
    if (!res?.success || !Array.isArray(res.data)) return []
    return res.data
      .filter((row) => row && typeof row.name === 'string' && row.name.trim())
      .map((row) => {
        const name = String(row.name).trim()
        const slug = String(row.slug ?? slugifyCatalogLabel(name))
        const rawImage = row.image
        const image =
          typeof rawImage === 'string' && rawImage.trim()
            ? resolveCatalogImageUrl(rawImage)
            : PLACEHOLDER_IMAGE
        return {
          id: String(row.id ?? slug),
          name,
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

/**
 * Merge live Zoho categories with categories derived from the storefront
 * product list. Live entries win for name/image; counts come from whichever
 * source has a non-zero value (live count, then derived count).
 */
export function mergeCategories(
  live: Category[],
  derived: Category[],
): Category[] {
  const bySlug = new Map<string, Category>()
  for (const c of derived) {
    bySlug.set(c.slug, { ...c })
  }
  for (const c of live) {
    const existing = bySlug.get(c.slug)
    bySlug.set(c.slug, {
      id: c.id || existing?.id || c.slug,
      name: c.name || existing?.name || c.slug,
      slug: c.slug,
      image:
        c.image && c.image !== PLACEHOLDER_IMAGE
          ? c.image
          : existing?.image ?? c.image,
      productCount: c.productCount || existing?.productCount || 0,
      subcategories: existing?.subcategories ?? c.subcategories,
    })
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name))
}
