'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Grid, List, SlidersHorizontal } from 'lucide-react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { categories as staticCategories } from '@/lib/data/categories'
import { productBelongsToCategoryPage } from '@/lib/categoryRouting'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export default function CategoryPageClient({ slug }: { slug: string }) {
  const { products, categories: liveCategories, loading } = useCatalog()
  /**
   * Prefer the static storefront route metadata (curated names + subcategory
   * lists) for known slugs (`arduino`, `sensors`, …). Fall back to the live
   * Zoho item-group / item-derived category for any slug coming from
   * `/api/zoho/products/categories` so dynamic Zoho groups still render with
   * a proper title and product count.
   */
  const categoryMeta =
    staticCategories.find((c) => c.slug === slug) ??
    liveCategories.find((c) => c.slug === slug)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('popularity')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    brands: [] as string[],
    categories: [] as string[],
    rating: 0,
    inStock: false,
  })

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => productBelongsToCategoryPage(p, slug))

    filtered = filtered.filter((p) => {
      const priceMatch =
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
      const brandMatch =
        filters.brands.length === 0 || filters.brands.includes(p.brand)
      const ratingMatch = p.rating >= filters.rating
      const stockMatch = !filters.inStock || p.stock > 0

      return priceMatch && brandMatch && ratingMatch && stockMatch
    })

    const sorted = [...filtered]
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        sorted.reverse()
        break
      default:
        break
    }

    return sorted
  }, [slug, products, filters, sortBy])

  const title =
    categoryMeta?.name ?? (loading && products.length === 0 ? 'Loading…' : slug.replace(/-/g, ' '))

  return (
    <div className="py-8 bg-ds-primary min-h-screen">
      <div className="container-custom">
        <nav className="flex items-center gap-2 text-sm text-ds-text-secondary mb-6 flex-wrap">
          <Link href="/" className="hover:text-ds-accent">
            Home
          </Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-ds-accent">
            Categories
          </Link>
          {categoryMeta && (
            <>
              <span>/</span>
              <span className="text-ds-text-primary font-medium">{categoryMeta.name}</span>
            </>
          )}
        </nav>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ds-text-primary mb-2">
            {title}
          </h1>
          <p className="text-ds-text-secondary">
            {loading && products.length === 0
              ? 'Loading products…'
              : `${filteredProducts.length} products found`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-ds-surface text-ds-accent'
                    : 'text-ds-text-secondary hover:bg-ds-primary'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-ds-surface text-ds-accent'
                    : 'text-ds-text-secondary hover:bg-ds-primary'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'popularity', label: 'Sort by: Popularity' },
              { value: 'price-low', label: 'Sort by: Price (Low to High)' },
              { value: 'price-high', label: 'Sort by: Price (High to Low)' },
              { value: 'rating', label: 'Sort by: Rating' },
              { value: 'newest', label: 'Sort by: Newest' },
            ]}
            className="w-full sm:w-64"
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              onFilterChange={setFilters}
              currentFilters={filters}
            />
          </aside>

          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-ds-text-secondary text-lg">
                  {products.length === 0 && loading
                    ? 'Loading products…'
                    : products.length === 0
                      ? 'No products loaded yet. Check your catalog sync or API connection.'
                      : 'No products in this category with the current filters.'}
                </p>
                <Button
                  onClick={() =>
                    setFilters({
                      priceRange: [0, 100000],
                      brands: [],
                      categories: [],
                      rating: 0,
                      inStock: false,
                    })
                  }
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
