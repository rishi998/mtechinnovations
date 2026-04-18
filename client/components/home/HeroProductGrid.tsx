'use client'

import { useMemo } from 'react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '../shop/ProductCard'

/**
 * Product grid as hero section — data from GET /api/products (Zoho-backed catalog).
 */
export function HeroProductGrid() {
  const { products, loading } = useCatalog()
  const bestsellers = useMemo(() => {
    const tagged = products.filter((p) => p.featured || p.trending)
    if (tagged.length) return tagged.slice(0, 8)
    return products.slice(0, 8)
  }, [products])

  if (loading && products.length === 0) {
    return (
      <section className="container-custom py-6 sm:py-8 bg-white border-b border-gray-100">
        <p className="text-sm text-gray-500">Loading products…</p>
      </section>
    )
  }

  if (bestsellers.length === 0) return null

  return (
    <section className="container-custom py-6 sm:py-8 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Bestsellers & Featured
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Synced from your inventory
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {bestsellers.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
