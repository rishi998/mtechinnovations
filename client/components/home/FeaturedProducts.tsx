'use client'

import { products } from '@/lib/data/products'
import { ProductCard } from '../shop/ProductCard'

export function FeaturedProducts() {
  const featuredProducts = products.filter((p) => p.featured).slice(0, 8)

  return (
    <section className="py-10 sm:py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Featured Products
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Handpicked products for makers and engineers
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
