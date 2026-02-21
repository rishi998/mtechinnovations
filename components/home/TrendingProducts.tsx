'use client'

import { products } from '@/lib/data/products'
import { ProductCard } from '../shop/ProductCard'
import { TrendingUp } from 'lucide-react'

export function TrendingProducts() {
  const trendingProducts = products.filter((p) => p.trending).slice(0, 8)

  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-3 mb-12">
          <TrendingUp className="w-8 h-8 text-primary-600" />
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
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
