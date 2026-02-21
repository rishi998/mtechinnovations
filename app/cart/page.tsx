'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)

  const shipping = cartTotal > 500 ? 0 : 50
  const tax = Math.round(cartTotal * 0.18)
  const total = cartTotal + shipping + tax - discount

  const handleApplyCoupon = () => {
    // Dummy coupon logic
    if (couponCode.toUpperCase() === 'SAVE10') {
      setDiscount(Math.round(cartTotal * 0.1))
    } else if (couponCode) {
      alert('Invalid coupon code')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <Link href="/">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart ({cartCount} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div>
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500">{item.product.brand}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-3 py-1.5 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-1.5 font-medium border-x">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.product.originalPrice && (
                          <p className="text-sm text-gray-400 line-through">
                            {formatPrice(item.product.originalPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={handleApplyCoupon} variant="outline">
                    Apply
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Coupon applied! You saved {formatPrice(discount)}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link href="/checkout">
                <Button size="lg" className="w-full mb-3">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/">
                <Button variant="outline" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>

              {/* Estimated Delivery */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Estimated Delivery:</strong> 3-5 business days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
