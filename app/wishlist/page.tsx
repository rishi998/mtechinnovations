'use client'

import { Heart } from 'lucide-react'
import { useWishlist } from '@/lib/context/WishlistContext'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function WishlistPage() {
  const { wishlist } = useWishlist()

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h1>
            <p className="text-gray-600 mb-6">
              Save your favorite products and never lose track of them
            </p>
            <Link href="/">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600 mb-8">{wishlist.length} items saved</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <ProductCard key={item.product.id} product={item.product} />
          ))}
        </div>
      </div>
    </div>
  )
}
