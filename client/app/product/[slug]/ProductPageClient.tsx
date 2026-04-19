'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Share2,
  Minus,
  Plus,
} from 'lucide-react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { getProductBySlugOrId, slugifyCatalogLabel } from '@/lib/api/catalog'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/context/CartContext'
import { useWishlist } from '@/lib/context/WishlistContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/shop/ProductCard'
import { formatPrice, calculateDiscount } from '@/lib/utils'

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1565814329452-e1efa73c9420?w=800'

export default function ProductPageClient({ slug }: { slug: string }) {
  const { products: catalogProducts, loading: catalogLoading } = useCatalog()
  const [product, setProduct] = useState<Product | null>(null)
  const [fetching, setFetching] = useState(false)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>(
    'description',
  )

  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    let cancelled = false
    const fromList = catalogProducts.find((p) => p.slug === slug)

    if (fromList) {
      setProduct(fromList)
    } else {
      setProduct(null)
    }

    setFetching(true)
    void getProductBySlugOrId(slug).then((p) => {
      if (cancelled) return
      setProduct(p)
      setFetching(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug, catalogProducts])

  const mainImage = useMemo(() => {
    if (!product?.images?.length) return PLACEHOLDER
    return product.images[selectedImage] ?? product.images[0] ?? PLACEHOLDER
  }, [product, selectedImage])

  const relatedProducts = useMemo(() => {
    if (!product) return []
    return catalogProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4)
  }, [catalogProducts, product])

  if (catalogLoading && !product && !fetching) {
    return (
      <div className="container-custom py-16 text-center text-ds-text-secondary">
        Loading product…
      </div>
    )
  }

  if (!product && !fetching) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="text-ds-text-secondary mb-4">Product not found.</p>
        <Link href="/" className="text-ds-accent font-medium hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center text-ds-text-secondary">
        Loading product…
      </div>
    )
  }

  const inWishlist = isInWishlist(product.id)
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0
  const categoryHref = `/category/${slugifyCatalogLabel(product.category)}`
  const specEntries = Object.entries(product.specs ?? {})

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  return (
    <div className="py-8 bg-ds-primary">
      <div className="container-custom">
        <nav className="flex items-center gap-2 text-sm text-ds-text-secondary mb-6 flex-wrap">
          <Link href="/" className="hover:text-ds-accent">
            Home
          </Link>
          <span>/</span>
          <Link href={categoryHref} className="hover:text-ds-accent">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-ds-text-primary truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="aspect-square bg-ds-surface rounded-xl mb-4 overflow-hidden relative">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {discount > 0 && (
                  <Badge variant="danger" className="absolute top-4 left-4">
                    {discount}% OFF
                  </Badge>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-ds-surface rounded-lg overflow-hidden border-2 ${
                        selectedImage === index
                          ? 'border-ds-accent'
                          : 'border-transparent hover:border-ds-border'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-ds-text-secondary uppercase mb-2">{product.brand}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-text-primary mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-ds-text-secondary'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-ds-text-secondary">
                  {product.rating} ({product.reviewsCount} reviews)
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-ds-accent">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice != null && product.originalPrice > 0 && (
                  <span className="text-lg sm:text-xl text-ds-text-secondary line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="mb-6">
                {product.stock > 0 ? (
                  <Badge variant="success" size="lg">
                    {product.stock < 10
                      ? `Only ${product.stock} left in stock`
                      : 'In Stock'}
                  </Badge>
                ) : (
                  <Badge variant="danger" size="lg">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <p className="text-ds-text-secondary mb-6 leading-relaxed">
                {product.description?.trim()
                  ? product.description
                  : `${product.name} — ${product.subcategory}. Stock: ${product.stock}.`}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-ds-text-secondary">Quantity:</span>
                <div className="flex items-center border border-ds-border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2.5 hover:bg-ds-primary active:bg-ds-surface"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-2.5 font-medium border-x min-w-[48px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(product.stock || 1, quantity + 1))
                    }
                    className="px-4 py-2.5 hover:bg-ds-primary active:bg-ds-surface"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  size="lg"
                  className="flex-1"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span className="hidden xs:inline">Add to Cart</span>
                  <span className="xs:hidden">Add</span>
                </Button>
                <Button
                  onClick={handleWishlistToggle}
                  variant="outline"
                  size="lg"
                  className="px-4"
                >
                  <Heart
                    className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                <Button variant="outline" size="lg" className="px-4">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-ds-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm">Free Shipping</p>
                    <p className="text-xs text-ds-text-secondary">On orders over ₹500</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-ds-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm">Warranty</p>
                    <p className="text-xs text-ds-text-secondary">As per manufacturer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-ds-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm">Easy Returns</p>
                    <p className="text-xs text-ds-text-secondary">7 days return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`px-4 sm:px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'description'
                  ? 'border-ds-accent text-ds-accent'
                  : 'border-transparent text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-4 sm:px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'specs'
                  ? 'border-ds-accent text-ds-accent'
                  : 'border-transparent text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`px-4 sm:px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'shipping'
                  ? 'border-ds-accent text-ds-accent'
                  : 'border-transparent text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          <div>
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-ds-text-secondary leading-relaxed">
                  {product.description?.trim()
                    ? product.description
                    : `Category: ${product.category}. Type: ${product.subcategory}.`}
                </p>
                {product.tags.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {product.tags.map((tag) => (
                      <li key={tag} className="text-ds-text-secondary">
                        • {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid md:grid-cols-2 gap-4">
                {specEntries.length === 0 ? (
                  <p className="text-ds-text-secondary text-sm">
                    No specifications listed for this item.
                  </p>
                ) : (
                  specEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center py-3 border-b">
                      <span className="font-medium text-ds-text-secondary w-1/2">{key}:</span>
                      <span className="text-ds-text-primary w-1/2">{value}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-ds-text-primary mb-2">Shipping</h3>
                  <p className="text-ds-text-secondary">
                    • Free shipping on orders over ₹500
                    <br />
                    • Standard delivery: 3–5 business days
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-ds-text-primary mb-2">Returns</h3>
                  <p className="text-ds-text-secondary">
                    • 7-day return policy from delivery date
                    <br />• Items must be in original condition
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-ds-text-primary mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
