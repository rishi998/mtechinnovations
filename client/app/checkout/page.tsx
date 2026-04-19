'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, CreditCard, Wallet, Building } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import { createOrder, getCart } from '@/lib/api'
import type { CartItem } from '@/lib/types'
import { checkoutPayPath } from '@/lib/paths'

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
})

type AddressForm = z.infer<typeof addressSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart, refreshCart } = useCart()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [shippingAddress, setShippingAddress] = useState<AddressForm | null>(null)
  /** Snapshot when leaving step 1 so payment/review still work if context cart refetches empty */
  const [checkoutCart, setCheckoutCart] = useState<CartItem[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  })

  const effectiveCart = step >= 2 && checkoutCart.length > 0 ? checkoutCart : cart
  const effectiveTotal = effectiveCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = effectiveTotal > 500 ? 0 : 50
  const tax = Math.round(effectiveTotal * 0.18)
  const total = effectiveTotal + shipping + tax

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent('/checkout')}`)
    }
  }, [authLoading, isAuthenticated, router])

  /** Logged-in users must have server-side cart rows (collection `cart_items`). */
  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    let cancelled = false
    void getCart()
      .then((items) => {
        if (cancelled) return
        if (items.length === 0) {
          router.replace('/cart')
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/cart')
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const onSubmitAddress = async (data: AddressForm) => {
    setOrderError('')
    let items: CartItem[]
    try {
      items = await getCart()
    } catch {
      setOrderError('Could not load your cart. Please try again.')
      return
    }
    if (!items.length) {
      setOrderError('Your cart is empty. Add items before continuing to payment.')
      router.push('/cart')
      return
    }
    setCheckoutCart(items)
    setShippingAddress(data)
    setStep(2)
  }

  /** Logged-in: create server order and open Razorpay on `/checkout/pay/?orderId=…` (static export). */
  const createOrderAndRedirectToPayment = async () => {
    if (!shippingAddress) return
    setOrderError('')
    let items: CartItem[]
    try {
      items = await getCart()
    } catch {
      setOrderError('Could not verify your cart. Please try again.')
      return
    }
    if (!items.length) {
      setOrderError('Your cart is empty. Add products before paying.')
      router.push('/cart')
      return
    }
    setIsProcessing(true)
    try {
      const order = await createOrder({
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
        },
        paymentMethod,
      })
      clearCart()
      void refreshCart()
      router.push(checkoutPayPath(order.id))
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Failed to start payment. Please try again.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                    step >= num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : num}
                </div>
                {num < 2 && (
                  <div
                    className={`w-12 sm:w-20 md:w-28 h-1 mx-1 sm:mx-2 ${
                      step > num ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-[220px] sm:max-w-sm mx-auto mt-2 px-2">
            <span className="text-xs sm:text-sm font-medium">Address</span>
            <span className="text-xs sm:text-sm font-medium">Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Shipping Address</h2>

                <form onSubmit={handleSubmit(onSubmitAddress)} className="space-y-4">
                  <Input
                    label="Full Name"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                  <Input
                    label="Phone Number"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                  <Input
                    label="Address Line 1"
                    {...register('addressLine1')}
                    error={errors.addressLine1?.message}
                  />
                  <Input
                    label="Address Line 2 (Optional)"
                    {...register('addressLine2')}
                    error={errors.addressLine2?.message}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      {...register('city')}
                      error={errors.city?.message}
                    />
                    <Input
                      label="State"
                      {...register('state')}
                      error={errors.state?.message}
                    />
                    <Input
                      label="Pincode"
                      {...register('pincode')}
                      error={errors.pincode?.message}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Continue to Payment
                  </Button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-medium">Credit / Debit Card</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard, Rupay</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      paymentMethod === 'upi'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Wallet className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-medium">UPI</p>
                      <p className="text-sm text-gray-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      paymentMethod === 'netbanking'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-medium">Net Banking</p>
                      <p className="text-sm text-gray-500">All major banks</p>
                    </div>
                  </button>
                </div>

                {orderError && (
                  <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {orderError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => void createOrderAndRedirectToPayment()}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Continue to secure payment
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({effectiveCart.length} items)</span>
                  <span>{formatPrice(effectiveTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
