'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'

const LIMIT = 8

export function BestsellersSection() {
  const { products, loading } = useCatalog()

  const bestsellers = useMemo(() => {
    const ranked = [...products].sort((a, b) => {
      if ((b.reviewsCount ?? 0) !== (a.reviewsCount ?? 0)) {
        return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0)
      }
      if ((b.rating ?? 0) !== (a.rating ?? 0)) {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }
      return Number(b.trending) - Number(a.trending)
    })
    return ranked.slice(0, LIMIT)
  }, [products])

  return (
    <section className="border-b border-ds-border bg-ds-primary py-10 md:py-12 lg:py-16">
      <div className="container-custom">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ds-text-primary md:text-4xl">
              Bestsellers
            </h2>
            <p className="mt-2 break-safe text-base text-ds-text-secondary md:text-lg">
              Top picks from our catalog, loved by makers and engineers.
            </p>
          </div>
          <Link
            href="/product/"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ds-border bg-ds-surface px-4 py-2 text-sm font-semibold uppercase tracking-wide text-ds-text-primary transition hover:border-ds-accent"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {loading
            ? Array.from({ length: LIMIT }).map((_, i) => <ProductCardSkeleton key={i} />)
            : bestsellers.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  )
}
