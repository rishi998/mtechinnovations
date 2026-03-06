'use client'

import { products } from '@/lib/data/products'
import { ProductCard } from '../shop/ProductCard'

/**
 * Product grid as hero section (Robu/Robocraze/Quartz style):
 * Bestsellers/featured with prominent pricing and Add to Cart CTAs.
 */
export function HeroProductGrid() {
  const bestsellers = products.filter((p) => p.featured || p.trending).slice(0, 8)

  if (bestsellers.length === 0) return null

  return (
    <section className="container-custom py-6 sm:py-8 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Bestsellers & Featured
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Most popular with makers and engineers
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
