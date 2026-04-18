'use client'

import { useRef, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '../shop/ProductCard'

/**
 * Latest products — uses `isNewLaunch` when set; otherwise first rows from API catalog.
 */
export function NewLaunchSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { products, loading } = useCatalog()

  const newProducts = useMemo(() => {
    const launched = products.filter((p) => p.isNewLaunch)
    if (launched.length) return launched
    return products.slice(0, 12)
  }, [products])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const step = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  }

  if (loading && products.length === 0) return null
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
                Latest from inventory
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory"
        >
          {newProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[260px] sm:w-[280px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/categories"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all categories
          </Link>
        </div>
      </div>
    </section>
  )
}
