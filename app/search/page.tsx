'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { products } from '@/lib/data/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { Input } from '@/components/ui/Input'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Search Products</h1>
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, categories, brands..."
              className="pl-12"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Results */}
        {searchQuery.trim() ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              {searchResults.length > 0
                ? `Found ${searchResults.length} result${searchResults.length > 1 ? 's' : ''} for &quot;${searchQuery}&quot;`
                : `No results found for &quot;${searchQuery}&quot;`}
            </h2>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <SearchIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-600 mb-2 text-lg">No products found</p>
                <p className="text-gray-500 text-sm">
                  Try different keywords or browse our categories
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Start typing to search for products</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto mb-12">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-6 w-48 mx-auto" />
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
