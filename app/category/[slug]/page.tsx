'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Grid, List, SlidersHorizontal } from 'lucide-react'
import { products } from '@/lib/data/products'
import { categories } from '@/lib/data/categories'
import { ProductCard } from '@/components/shop/ProductCard'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const category = categories.find((c) => c.slug === slug)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('popularity')
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    brands: [] as string[],
    categories: [] as string[],
    rating: 0,
    inStock: false,
  })

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => p.category === category?.name || !category)

    // Apply filters
    filtered = filtered.filter((p) => {
      const priceMatch = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
      const brandMatch = filters.brands.length === 0 || filters.brands.includes(p.brand)
      const ratingMatch = p.rating >= filters.rating
      const stockMatch = !filters.inStock || p.stock > 0
      
      return priceMatch && brandMatch && ratingMatch && stockMatch
    })

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filtered.reverse()
        break
      default:
        // popularity (keep original order)
        break
    }

    return filtered
  }, [category, filters, sortBy])

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <a href="/categories" className="hover:text-primary-600">Categories</a>
          {category && (
            <>
              <span>/</span>
              <span className="text-gray-900 font-medium">{category.name}</span>
            </>
          )}
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {category?.name || 'All Products'}
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} products found
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Left Side */}
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
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Side */}
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

        {/* Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              onFilterChange={setFilters}
              currentFilters={filters}
            />
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <Button
                  onClick={() => setFilters({
                    priceRange: [0, 10000],
                    brands: [],
                    categories: [],
                    rating: 0,
                    inStock: false,
                  })}
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
