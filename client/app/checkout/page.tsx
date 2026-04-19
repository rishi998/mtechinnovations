'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, CreditCard, Wallet, Building, MapPin } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import { createOrder, getCart } from '@/lib/api'
import type { Address, CartItem } from '@/lib/types'
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
  const { isAuthenticated, isLoading: authLoading, user, refreshUser } = useAuth()
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [shippingAddress, setShippingAddress] = useState<AddressForm | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  /** Snapshot when leaving step 1 so payment/review still work if context cart refetches empty */
  const [checkoutCart, setCheckoutCart] = useState<CartItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
    },
  })

  const savedAddresses = user?.addresses ?? []

  const applySavedAddress = (addr: Address) => {
    reset({
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    })
    setSelectedSavedId(addr.id)
  }

  const clearSavedSelection = () => {
    setSelectedSavedId(null)
    reset({
      name: user?.name || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
    })
  }

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

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void refreshUser()
  }, [authLoading, isAuthenticated, refreshUser])

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
      <div className="min-h-screen bg-ds-primary flex items-center justify-center">
        <p className="text-ds-text-secondary text-sm">Loading…</p>
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
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                    step >= num
                      ? 'bg-ds-accent text-ds-inverse'
                      : 'bg-ds-surface text-ds-text-secondary'
                  }`}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : num}
                </div>
                {num < 2 && (
                  <div
                    className={`w-12 sm:w-20 md:w-28 h-1 mx-1 sm:mx-2 ${
                      step > num ? 'bg-ds-accent' : 'bg-ds-surface'
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
              <div className="border border-ds-border bg-ds-surface rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-ds-text-primary mb-6">Shipping Address</h2>

                {savedAddresses.length === 0 && (
                  <div className="mb-6 rounded-lg border border-ds-border bg-ds-primary px-4 py-3 text-sm text-ds-text-secondary">
                    <span className="text-ds-text-primary">No saved addresses yet.</span>{' '}
                    <Link href="/profile/addresses/" className="font-semibold text-ds-accent hover:brightness-110">
                      Add addresses in your profile
                    </Link>{' '}
                    to reuse them here.
                  </div>
                )}

                {savedAddresses.length > 0 && (
                  <div className="mb-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary">
                        Use a saved address
                      </p>
                      {selectedSavedId && (
                        <button
                          type="button"
                          onClick={clearSavedSelection}
                          className="text-sm font-medium text-ds-accent transition duration-180 hover:brightness-110"
                        >
                          Enter a new address
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedAddresses.map((addr) => {
                        const active = selectedSavedId === addr.id
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applySavedAddress(addr)}
                            className={`rounded-xl border p-4 text-left transition duration-200 ${
                              active
                                ? 'border-ds-accent bg-ds-primary ring-1 ring-ds-accent'
                                : 'border-ds-border bg-ds-primary hover:border-ds-text-secondary'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin
                                className={`mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-ds-accent' : 'text-ds-text-secondary'}`}
                                strokeWidth={1.75}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-ds-text-primary">{addr.name}</span>
                                  {addr.isDefault && (
                                    <span className="rounded border border-ds-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-ds-text-secondary">{addr.phone}</p>
                                <p className="mt-1 text-sm leading-relaxed text-ds-text-secondary">
                                  {addr.addressLine1}
                                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                                  <br />
                                  {addr.city}, {addr.state} — {addr.pincode}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-ds-text-secondary">
                      Tap an address to fill the form below, or enter a different shipping address.
                    </p>
                  </div>
                )}

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
              <div className="border border-ds-border bg-ds-surface rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-ds-text-primary mb-6">Payment Method</h2>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-ds-accent bg-ds-surface'
                        : 'border-ds-border hover:border-ds-border'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-medium">Credit / Debit Card</p>
                      <p className="text-sm text-ds-text-secondary">Visa, Mastercard, Rupay</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      paymentMethod === 'upi'
                        ? 'border-ds-accent bg-ds-surface'
                        : 'border-ds-border hover:border-ds-border'
                    }`}
                  >
                    <Wallet className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-medium">UPI</p>
                      <p className="text-sm text-ds-text-secondary">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      paymentMethod === 'netbanking'
                        ? 'border-ds-accent bg-ds-surface'
                        : 'border-ds-border hover:border-ds-border'
                    }`}
                  >
                    <Building className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-medium">Net Banking</p>
                      <p className="text-sm text-ds-text-secondary">All major banks</p>
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
            <div className="border border-ds-border bg-ds-surface rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-ds-text-primary mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-ds-text-secondary">
                  <span>Subtotal ({effectiveCart.length} items)</span>
                  <span>{formatPrice(effectiveTotal)}</span>
                </div>
                <div className="flex justify-between text-ds-text-secondary">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-ds-text-secondary">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-ds-text-primary">
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
