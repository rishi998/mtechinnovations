'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'
import { ProductTabs, type FeaturedTabId } from '@/components/product/ProductTabs'
import {
  ProductFilters,
  MobileFiltersDrawer,
  type SortOption,
} from '@/components/product/ProductFilters'
import { QuickViewModal } from '@/components/product/QuickViewModal'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const SKELETON_COUNT = 8
const PAGE_SIZE = 8
const LOAD_STEP = 4

function applyTab(pool: Product[], tab: FeaturedTabId): Product[] {
  switch (tab) {
    case 'bestsellers': {
      const x = pool.filter((p) => p.reviewsCount >= 120)
      return x.length ? x : pool
    }
    case 'new': {
      const x = pool.filter((p) => p.isNewLaunch)
      return x.length ? x : pool
    }
    case 'trending': {
      const x = pool.filter((p) => p.trending)
      return x.length ? x : pool
    }
    default:
      return pool
  }
}

function sortProducts(list: Product[], sort: SortOption, allProducts: Product[]): Product[] {
  const idx = new Map(allProducts.map((p, i) => [p.id, i]))
  const copy = [...list]
  if (sort === 'price-asc') copy.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') copy.sort((a, b) => b.price - a.price)
  else copy.sort((a, b) => (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0))
  return copy
}

export function ProductGrid() {
  const { products, loading, categories } = useCatalog()
  const { ref, visible } = useScrollReveal()
  const { ref: recRef, visible: recVisible } = useScrollReveal()

  const [tab, setTab] = useState<FeaturedTabId>('all')
  const [sort, setSort] = useState<SortOption>('default')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [quickView, setQuickView] = useState<Product | null>(null)

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'All categories' },
      ...categories.map((c) => ({ value: c.name, label: c.name })),
    ],
    [categories],
  )

  const basePool = useMemo(() => {
    const f = products.filter((p) => p.featured)
    return f.length >= 4 ? f : products
  }, [products])

  const pipeline = useMemo(() => {
    const tabbed = applyTab(basePool, tab)
    const cat = categoryFilter
      ? tabbed.filter((p) => p.category === categoryFilter)
      : tabbed
    const minN = priceMin !== '' ? Number(priceMin) : NaN
    const maxN = priceMax !== '' ? Number(priceMax) : NaN
    let priced = cat
    if (!Number.isNaN(minN)) priced = priced.filter((p) => p.price >= minN)
    if (!Number.isNaN(maxN)) priced = priced.filter((p) => p.price <= maxN)
    return sortProducts(priced, sort, products)
  }, [basePool, tab, categoryFilter, priceMin, priceMax, sort, products])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [tab, sort, categoryFilter, priceMin, priceMax])

  const visibleSlice = useMemo(
    () => pipeline.slice(0, visibleCount),
    [pipeline, visibleCount],
  )

  const hasMore = visibleCount < pipeline.length

  const recommended = useMemo(() => {
    const shown = new Set(visibleSlice.map((p) => p.id))
    const trending = products.filter((p) => !shown.has(p.id) && p.trending)
    if (trending.length >= 6) return trending.slice(0, 12)
    return products.filter((p) => !shown.has(p.id)).slice(0, 12)
  }, [products, visibleSlice])

  const handleLoadMore = useCallback(() => {
    setVisibleCount((n) => n + LOAD_STEP)
  }, [])

  const filterProps = {
    sort,
    onSortChange: setSort,
    category: categoryFilter,
    onCategoryChange: setCategoryFilter,
    categories: categoryOptions,
    priceMin,
    priceMax,
    onPriceMinChange: setPriceMin,
    onPriceMaxChange: setPriceMax,
  }

  return (
    <>
      <section
        ref={ref as React.LegacyRef<HTMLElement>}
        className={cn(
          'border-b border-ds-border bg-ds-primary py-10 md:py-12 lg:py-16 transition duration-600 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        )}
      >
        <div className="container-custom">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-section font-semibold tracking-tight text-ds-text-primary">
                Popular right now
              </h2>
              <p className="mt-4 max-w-xl break-safe text-base leading-[1.75] text-ds-text-secondary">
                Best-selling development boards and modules—ready to ship with live stock and pricing.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <ProductTabs value={tab} onChange={setTab} />
            <ProductFilters {...filterProps} onOpenMobileDrawer={() => setFilterDrawerOpen(true)} />
          </div>

          <div className="mt-10 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-8">
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <ProductCardSkeleton key={i} />)
              : visibleSlice.map((p) => (
                  <div key={p.id} className="h-full min-h-0">
                    <ProductCard product={p} onQuickView={setQuickView} />
                  </div>
                ))}
          </div>

          {!loading && pipeline.length === 0 && (
            <p className="mt-10 break-safe text-center text-sm text-ds-text-secondary">
              No products match these filters. Try another tab or clear filters.
            </p>
          )}

          {hasMore && !loading && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="min-h-10 rounded-lg border border-ds-border bg-ds-surface px-8 py-3 text-sm font-semibold uppercase tracking-wide text-ds-text-primary transition duration-180 ease-out hover:border-ds-accent hover:brightness-110"
              >
                Load More Products
              </button>
            </div>
          )}

          <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/product/"
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border-2 border-ds-accent bg-transparent px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-ds-accent transition duration-180 ease-out hover:bg-ds-surface sm:max-w-xs"
            >
              Explore All Products
            </Link>
            <Link
              href="/categories/"
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border-2 border-ds-accent bg-transparent px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-ds-accent transition duration-180 ease-out hover:bg-ds-surface sm:max-w-xs"
            >
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      <section
        ref={recRef as React.LegacyRef<HTMLElement>}
        className={cn(
          'border-b border-ds-border bg-ds-primary py-10 md:py-12 lg:py-16 transition duration-600 ease-out',
          recVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        )}
      >
        <div className="container-custom">
          <h2 className="text-section font-semibold tracking-tight text-ds-text-primary">
            Recommended for you
          </h2>
          <p className="mt-4 max-w-2xl break-safe text-base leading-[1.75] text-ds-text-secondary">
            Popular in robotics and prototyping—picked from live catalog signals.
          </p>
          <div className="mt-10 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 hide-scrollbar md:mx-0 md:px-0">
            {!loading &&
              recommended.map((p) => (
                <div key={p.id} className="flex h-full w-[220px] shrink-0 sm:w-[240px]">
                  <ProductCard variant="compact" product={p} onQuickView={setQuickView} />
                </div>
              ))}
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[220px] shrink-0 sm:w-[240px]">
                  <ProductCardSkeleton />
                </div>
              ))}
          </div>
        </div>
      </section>

      <MobileFiltersDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        {...filterProps}
      />
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </>
  )
}
