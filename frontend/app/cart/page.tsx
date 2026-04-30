'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useAuth } from '@/lib/context/AuthContext'
import { getCart } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import { productPath } from '@/lib/paths'
import { firstProductImageUrl } from '@/lib/api/catalog'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [checkoutError, setCheckoutError] = useState('')

  const proceedToCheckout = async () => {
    setCheckoutError('')
    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent('/checkout')}`,
      )
      return
    }
    try {
      const items = await getCart()
      if (!items.length) {
        setCheckoutError('Your cart is empty in our system. Add items again.')
        return
      }
      router.push('/checkout')
    } catch {
      setCheckoutError('Could not verify your cart. Please try again.')
    }
  }

  const shipping = cartTotal > 500 ? 0 : 50
  const total = cartTotal + shipping - discount

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
      <div className="min-h-screen bg-ds-primary py-16">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="w-24 h-24 text-ds-text-secondary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-ds-text-primary mb-2">Your cart is empty</h1>
            <p className="text-ds-text-secondary mb-6">
              Looks like you haven&apos;t added anything to your cart yet
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
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom">
        <h1 className="text-2xl sm:text-3xl font-bold text-ds-text-primary mb-6 sm:mb-8">Shopping Cart ({cartCount} items)</h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="border border-ds-border bg-ds-surface rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-ds-surface rounded-lg flex-shrink-0 overflow-hidden">
                    <Image
                      src={firstProductImageUrl(item.product.images)}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <Link
                          href={productPath(item.product.slug, item.product.id)}
                          className="font-medium text-ds-text-primary hover:text-ds-accent line-clamp-2 text-sm sm:text-base"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs sm:text-sm text-ds-text-secondary">{item.product.brand}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 hover:text-red-700 flex-shrink-0 p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-ds-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2.5 sm:px-3 py-2 hover:bg-ds-primary active:bg-ds-surface"
                        >
                          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <span className="px-3 sm:px-4 py-2 font-medium border-x text-sm sm:text-base min-w-[36px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-2.5 sm:px-3 py-2 hover:bg-ds-primary active:bg-ds-surface disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-bold text-ds-accent">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.product.originalPrice && (
                          <p className="text-xs sm:text-sm text-ds-text-secondary line-through">
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
            <div className="border border-ds-border bg-ds-surface rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-ds-text-primary mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={handleApplyCoupon} variant="outline" className="sm:flex-shrink-0">
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
                <div className="flex justify-between text-ds-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ds-text-secondary">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-ds-text-primary">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button — logged-in users must have server cart (`cart_items`) */}
              {checkoutError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{checkoutError}</p>
              )}
              <Button size="lg" className="w-full mb-3" type="button" onClick={() => void proceedToCheckout()}>
                Proceed to Checkout
              </Button>

              <Link href="/">
                <Button variant="outline" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>

              {/* Estimated Delivery */}
              <div className="mt-6 p-4 bg-ds-primary rounded-lg">
                <p className="text-sm text-ds-text-secondary">
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
