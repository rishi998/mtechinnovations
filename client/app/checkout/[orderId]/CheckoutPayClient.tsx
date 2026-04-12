'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Package } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import {
  createOrderPayment,
  getOrderById,
  verifyRazorpayPayment,
} from '@/lib/api'
import type { Order } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

/** Prevents duplicate Razorpay init when React Strict Mode double-mounts in development. */
const checkoutInitKeys = new Set<string>()

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Razorpay checkout'))
    document.body.appendChild(s)
  })
}

export function CheckoutPayClient({ orderId: orderIdParam }: { orderId: string }) {
  const router = useRouter()

  const { isAuthenticated, isLoading: authLoading, user } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [loadError, setLoadError] = useState('')
  const [payState, setPayState] = useState<'idle' | 'opening' | 'verifying'>(
    'idle',
  )

  const runCheckout = useCallback(async () => {
    if (!orderIdParam) return
    setLoadError('')

    try {
      const o = await getOrderById(orderIdParam)
      if (o.status !== 'pending') {
        checkoutInitKeys.delete(orderIdParam)
        setLoadError('This order is not awaiting payment.')
        setOrder(o)
        return
      }
      setOrder(o)

      const payment = await createOrderPayment(orderIdParam)
      await loadRazorpayScript()

      const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? 'Your Company'

      const rzp = new window.Razorpay({
        key: payment.key,
        amount: payment.amount,
        currency: 'INR',
        name: storeName,
        description: 'Order Payment',
        order_id: payment.razorpayOrderId,
        handler: async function (response) {
          setPayState('verifying')
          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            checkoutInitKeys.delete(orderIdParam)
            const q = verified.orderId
              ? `?orderId=${encodeURIComponent(verified.orderId)}`
              : ''
            router.push(`/success${q}`)
          } catch (e) {
            setLoadError(
              e instanceof Error
                ? e.message
                : 'Payment verification failed. Contact support if money was debited.',
            )
            setPayState('idle')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: '#3399cc' },
        modal: {
          ondismiss: () => {
            setPayState('idle')
            setLoadError('Payment was cancelled or closed.')
          },
        },
      })

      setPayState('opening')
      rzp.open()
    } catch (e) {
      checkoutInitKeys.delete(orderIdParam)
      setLoadError(
        e instanceof Error ? e.message : 'Could not start Razorpay checkout.',
      )
    }
  }, [orderIdParam, user, router])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/checkout/${orderIdParam}`)}`,
      )
      return
    }
    if (!orderIdParam) {
      setLoadError('Invalid order link.')
      return
    }
    if (checkoutInitKeys.has(orderIdParam)) return
    checkoutInitKeys.add(orderIdParam)
    void runCheckout()
  }, [authLoading, isAuthenticated, orderIdParam, router, runCheckout])

  const retry = () => {
    if (!orderIdParam) return
    checkoutInitKeys.delete(orderIdParam)
    setLoadError('')
    checkoutInitKeys.add(orderIdParam)
    void runCheckout()
  }

  if (authLoading || (!loadError && !order && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-gray-600 text-center text-sm">
          {payState === 'verifying'
            ? 'Verifying payment with the server…'
            : 'Preparing secure checkout…'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="container-custom max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pay for order</h1>
        <p className="text-gray-600 text-sm mb-8">
          Razorpay opens automatically. Complete payment in the popup; we never
          trust the browser alone—the server verifies every payment.
        </p>

        {payState === 'verifying' && order && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 text-primary-900 text-sm px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            Verifying payment on the server…
          </div>
        )}

        {order && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Package className="w-4 h-4" />
              <span>Order {order.orderId}</span>
            </div>
            <ul className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              {order.items.map((item) => (
                <li
                  key={item.product.id + String(item.quantity)}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-800 line-clamp-2 pr-4">
                    {item.product.name}{' '}
                    <span className="text-gray-500">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900 flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div
            className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 text-sm"
            role="alert"
          >
            {loadError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {loadError && (
            <Button type="button" onClick={retry} className="sm:flex-1">
              Try again
            </Button>
          )}
          <Link href="/orders" className="sm:flex-1">
            <Button variant="outline" className="w-full" type="button">
              Back to orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
