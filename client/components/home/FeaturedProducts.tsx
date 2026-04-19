'use client'

import { useMemo } from 'react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '../shop/ProductCard'

export function FeaturedProducts() {
  const { products, loading } = useCatalog()
  const featuredProducts = useMemo(() => {
    const f = products.filter((p) => p.featured)
    if (f.length) return f.slice(0, 8)
    return products.slice(0, 8)
  }, [products])

  if (loading && products.length === 0) {
    return (
      <section className="py-10 sm:py-16 bg-ds-primary">
        <div className="container-custom text-center text-ds-text-secondary text-sm">
          Loading catalog…
        </div>
      </section>
    )
  }

  if (featuredProducts.length === 0) return null

  return (
    <section className="py-10 sm:py-16 bg-ds-primary">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ds-text-primary mb-3">
            Featured Products
          </h2>
          <p className="text-ds-text-secondary text-base sm:text-lg">
            From your Zoho inventory — live stock and pricing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
