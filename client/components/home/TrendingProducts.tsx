'use client'

import { useMemo } from 'react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '../shop/ProductCard'
import { TrendingUp } from 'lucide-react'

export function TrendingProducts() {
  const { products, loading } = useCatalog()
  const trendingProducts = useMemo(() => {
    const t = products.filter((p) => p.trending)
    if (t.length) return t.slice(0, 8)
    return products.slice(0, 8)
  }, [products])

  if (loading && products.length === 0) return null
  if (trendingProducts.length === 0) return null

  return (
    <section className="py-10 sm:py-16">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Trending Now
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
