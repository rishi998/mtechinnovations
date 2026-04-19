'use client'

import { useMemo, useState, useEffect } from 'react'
import { ProductCard } from '@/components/product/ProductCard'
import { PdpSection } from '@/components/product/PdpSection'
import {
  productBelongsToCategoryPage,
  storefrontCategorySlugForProduct,
} from '@/lib/categoryRouting'
import type { Product } from '@/lib/types'

type RecommendedProductsProps = {
  product: Product
  catalog: Product[]
  excludeIds: string[]
}

export function RecommendedProducts({ product, catalog, excludeIds }: RecommendedProductsProps) {
  const [recentIds, setRecentIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pdp_recent_ids')
      const parsed: string[] = raw ? JSON.parse(raw) : []
      setRecentIds(parsed)
    } catch {
      setRecentIds([])
    }
  }, [product.id])

  const items = useMemo(() => {
    const exclude = new Set([...excludeIds, product.id])
    const bucket = storefrontCategorySlugForProduct(product)

    const fromRecent = recentIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is Product => !!p && !exclude.has(p.id))

    const pool = catalog.filter((p) => {
      if (exclude.has(p.id)) return false
      if (!bucket) return true
      return productBelongsToCategoryPage(p, bucket)
    })
    pool.sort((a, b) => {
      const tb = (b.trending ? 1 : 0) - (a.trending ? 1 : 0)
      if (tb !== 0) return tb
      return b.reviewsCount - a.reviewsCount
    })

    const out: Product[] = []
    const seen = new Set<string>()
    for (const p of [...fromRecent, ...pool]) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      out.push(p)
      if (out.length >= 8) break
    }
    return out
  }, [product, catalog, excludeIds, recentIds])

  if (items.length === 0) return null

  return (
    <PdpSection className="border-b border-ds-border bg-ds-surface py-12 md:py-16">
      <div className="container-custom">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Recommended for You</h2>
        <p className="mt-2 text-sm text-ds-text-secondary">
          Based on this category, trending picks, and your recently viewed items.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </PdpSection>
  )
}
