import Link from 'next/link'
import Image from 'next/image'
import { categories } from '@/lib/data/categories'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
            <p className="text-gray-600">Browse products by category</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="overflow-hidden">
              <div className="relative h-40 w-full bg-gray-100">
                {/* Use Image if available */}
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{cat.productCount} products</p>
                <div className="flex items-center justify-between">
                  <Link href={`/category/${cat.slug}`}>
                    <Button size="sm">View Products</Button>
                  </Link>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-primary-600 hover:text-primary-700">
                    Browse
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
