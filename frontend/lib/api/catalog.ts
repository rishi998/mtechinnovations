import type { Product, Category } from '@/lib/types'
import { getPublicApiUrl } from '@/lib/env/publicApi'
import { api } from './client'

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800'

/** First non-empty image URL, or catalog placeholder (safe for Next/Image `src`). */
export function firstProductImageUrl(images?: string[] | null): string {
  const first = images?.find((u) => typeof u === 'string' && u.trim().length > 0)
  return first?.trim() ?? PLACEHOLDER_IMAGE
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
  const images =
    Array.isArray(imagesRaw) && imagesRaw.length > 0
      ? (imagesRaw as string[]).filter((u) => typeof u === 'string' && u.length > 0)
      : [PLACEHOLDER_IMAGE]
  return {
    id,
    name: String(doc.name ?? ''),
    slug: String(doc.slug ?? ''),
    sku: doc.sku != null && doc.sku !== '' ? String(doc.sku) : undefined,
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
