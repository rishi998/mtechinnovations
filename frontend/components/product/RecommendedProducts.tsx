'use client'

import { useMemo } from 'react'
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
  const items = useMemo(() => {
    const exclude = new Set([...excludeIds, product.id])
    const bucket = storefrontCategorySlugForProduct(product)

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

    return pool.slice(0, 8)
  }, [product, catalog, excludeIds])

  if (items.length === 0) return null

  return (
    <PdpSection className="border-b border-ds-border bg-ds-surface py-12 md:py-16">
      <div className="container-custom">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Recommended for You</h2>
        <p className="mt-2 text-sm text-ds-text-secondary">
          Based on this category and trending picks from the catalog.
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
