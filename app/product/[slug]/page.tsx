'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Share2, Minus, Plus } from 'lucide-react'
import { products } from '@/lib/data/products'
import { useCart } from '@/lib/context/CartContext'
import { useWishlist } from '@/lib/context/WishlistContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/shop/ProductCard'
import { formatPrice, calculateDiscount } from '@/lib/utils'

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string
  const product = products.find((p) => p.slug === slug)
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description')
  
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  if (!product) {
    return <div className="container-custom py-16 text-center">Product not found</div>
  }

  const inWishlist = isInWishlist(product.id)
  const discount = product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0
  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

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
    <div className="py-8 bg-gray-50">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <a href="/" className="hover:text-primary-600">Home</a>
          <span>/</span>
          <a href={`/category/${product.category}`} className="hover:text-primary-600">
            {product.category}
          </a>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {discount > 0 && (
                  <Badge variant="danger" className="absolute top-4 left-4">
                    {discount}% OFF
                  </Badge>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index
                          ? 'border-primary-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <p className="text-sm text-gray-500 uppercase mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviewsCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-primary-600">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <Badge variant="success" size="lg">
                    {product.stock < 10 ? `Only ${product.stock} left in stock` : 'In Stock'}
                  </Badge>
                ) : (
                  <Badge variant="danger" size="lg">Out of Stock</Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-2 font-medium border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-8">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  size="lg"
                  className="flex-1"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleWishlistToggle}
                  variant="outline"
                  size="lg"
                >
                  <Heart
                    className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm">Free Shipping</p>
                    <p className="text-xs text-gray-600">On orders over ₹500</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm">Warranty</p>
                    <p className="text-xs text-gray-600">1 Year warranty</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm">Easy Returns</p>
                    <p className="text-xs text-gray-600">7 days return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
          {/* Tab Headers */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'shipping'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                <ul className="mt-4 space-y-2">
                  {product.tags.map((tag) => (
                    <li key={tag} className="text-gray-600">
                      • {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center py-3 border-b">
                    <span className="font-medium text-gray-700 w-1/2">{key}:</span>
                    <span className="text-gray-900 w-1/2">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shipping Information</h3>
                  <p className="text-gray-700">
                    • Free shipping on all orders over ₹500<br />
                    • Standard delivery: 3-5 business days<br />
                    • Express delivery available at checkout
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Return Policy</h3>
                  <p className="text-gray-700">
                    • 7-day return policy from delivery date<br />
                    • Products must be in original condition<br />
                    • Free return pickup available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
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
