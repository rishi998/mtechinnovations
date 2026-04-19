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
      <div className="min-h-screen bg-ds-primary py-8">
        <div className="container-custom text-center text-ds-text-secondary">
          Loading categories from your catalog…
        </div>
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen bg-ds-primary py-8">
        <div className="container-custom text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-ds-text-secondary">
            Ensure the API is running and products are synced from Zoho.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ds-text-primary">All Categories</h1>
            <p className="text-ds-text-secondary">
              Derived from your Zoho-backed product catalog
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-ds-text-secondary text-center py-16">
            No categories yet. Run{' '}
            <code className="text-sm bg-ds-surface px-1 rounded">POST /api/zoho/products/sync</code>{' '}
            on the server, then refresh.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                hover
                className="flex h-full flex-col overflow-hidden p-0 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
              >
                <div className="relative h-40 w-full shrink-0 bg-ds-primary">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-6">
                  <h3 className="text-base font-semibold leading-snug text-ds-text-primary">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-sm text-ds-text-secondary">
                    {cat.productCount} {cat.productCount === 1 ? 'product' : 'products'}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <Link href={`/category/${cat.slug}/`} className="shrink-0">
                      <Button size="sm" className="text-sm font-semibold uppercase tracking-wide">
                        View Products
                      </Button>
                    </Link>
                    <Link
                      href={`/category/${cat.slug}/`}
                      className="text-sm font-semibold uppercase tracking-wide text-ds-accent transition duration-180 hover:brightness-110"
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
