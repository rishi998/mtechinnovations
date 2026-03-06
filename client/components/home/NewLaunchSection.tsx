'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { products } from '@/lib/data/products'
import { ProductCard } from '../shop/ProductCard'

/**
 * New Launch / Latest Products slider (Robocraze/Quartz style)
 * with savings badges and prominent CTAs.
 */
export function NewLaunchSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const newProducts = products.filter((p) => p.isNewLaunch).length > 0
    ? products.filter((p) => p.isNewLaunch)
    : products.slice(0, 6) // fallback: first 6 as "latest"

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const step = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  }

  if (newProducts.length === 0) return null

  return (
    <section className="py-10 sm:py-16 bg-gray-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent-orange" />
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                New Launch
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Latest products with great savings
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {newProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/search?sort=latest"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all latest products →
          </Link>
        </div>
      </div>
    </section>
  )
}
