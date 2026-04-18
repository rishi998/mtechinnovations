'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCatalog } from '@/lib/context/CatalogContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CategoriesPage() {
  const { categories, loading, error } = useCatalog()

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom text-center text-gray-500">
          Loading categories from your catalog…
        </div>
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Ensure the API is running and products are synced from Zoho.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
            <p className="text-gray-600">
              Derived from your Zoho-backed product catalog
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-gray-600 text-center py-16">
            No categories yet. Run{' '}
            <code className="text-sm bg-gray-100 px-1 rounded">POST /api/zoho/products/sync</code>{' '}
            on the server, then refresh.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card key={cat.id} className="overflow-hidden">
                <div className="relative h-40 w-full bg-gray-100">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{cat.productCount} products</p>
                  <div className="flex items-center justify-between">
                    <Link href={`/category/${cat.slug}`}>
                      <Button size="sm">View Products</Button>
                    </Link>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Browse
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
