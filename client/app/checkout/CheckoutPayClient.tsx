'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Loader2, Package, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import {
  createOrderPayment,
  getOrderById,
  verifyRazorpayPayment,
} from '@/lib/api'
import type { Order } from '@/lib/types'
import type { RazorpayConstructorOptions } from '@/types/razorpay'
import { checkoutPayPath } from '@/lib/paths'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

/** Razorpay prefill breaks some card / OTP flows if `contact` is not a valid 10-digit Indian mobile. */
function razorpayPrefillContact(
  raw: string | undefined | null,
): string | undefined {
  if (raw == null || typeof raw !== 'string') return undefined
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return undefined
  const last10 = digits.slice(-10)
  if (/^[6-9]\d{9}$/.test(last10)) return last10
  return undefined
}

function razorpayPrefill(
  user: { name?: string; email?: string; phone?: string } | null | undefined,
  order: Order,
): { name?: string; email?: string; contact?: string } {
  const name =
    [user?.name, order.shippingAddress?.name].find(
      (s) => typeof s === 'string' && s.trim().length > 0,
    )?.trim() ?? undefined
  const email =
    typeof user?.email === 'string' && user.email.includes('@')
      ? user.email.trim().toLowerCase()
      : undefined
  const contact = razorpayPrefillContact(
    user?.phone ?? order.shippingAddress?.phone,
  )
  const out: { name?: string; email?: string; contact?: string } = {}
  if (name) out.name = name
  if (email) out.email = email
  if (contact) out.contact = contact
  return out
}

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

type PayPhase = 'idle' | 'creating' | 'verifying'

export function CheckoutPayClient({ orderId: orderIdParam }: { orderId: string }) {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const paymentCompletedRef = useRef(false)

  const [order, setOrder] = useState<Order | null>(null)
  const [orderLoading, setOrderLoading] = useState(true)
  const [orderError, setOrderError] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [payPhase, setPayPhase] = useState<PayPhase>('idle')
  /** True while Razorpay’s modal is open (success, failure, or retry — avoids “Starting checkout…” stuck behind it). */
  const [razorpayOpen, setRazorpayOpen] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderIdParam) return
    setOrderLoading(true)
    setOrderError('')
    try {
      const o = await getOrderById(orderIdParam)
      setOrder(o)
    } catch (e) {
      setOrder(null)
      setOrderError(
        e instanceof Error ? e.message : 'Could not load order details.',
      )
    } finally {
      setOrderLoading(false)
    }
  }, [orderIdParam])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace(
        `/login?redirect=${encodeURIComponent(checkoutPayPath(orderIdParam))}`,
      )
      return
    }
    if (!orderIdParam) {
      setOrderError('Invalid order link.')
      setOrderLoading(false)
      return
    }
    void loadOrder()
  }, [authLoading, isAuthenticated, orderIdParam, router, loadOrder])

  const startPayment = useCallback(async () => {
    if (!orderIdParam || !order) return
    setPaymentError('')
    paymentCompletedRef.current = false
    setPayPhase('creating')

    try {
      if (order.status !== 'pending') {
        setPaymentError('This order is not awaiting payment.')
        setPayPhase('idle')
        return
      }
      if ((order.paymentStatus ?? 'pending') === 'success') {
        setPaymentError('This order is already paid.')
        setPayPhase('idle')
        return
      }

      const payment = await createOrderPayment(orderIdParam)
      await loadRazorpayScript()

      const storeName =
        process.env.NEXT_PUBLIC_STORE_NAME ?? 'Your Store'

      const prefill = razorpayPrefill(user, order)

      const options: RazorpayConstructorOptions = {
        key: payment.key,
        // Amount/currency come from the Razorpay order created on the server (avoids mismatch bugs).
        name: storeName,
        description: 'Order Payment',
        order_id: payment.razorpayOrderId,
        handler: async (response) => {
          paymentCompletedRef.current = true
          setRazorpayOpen(false)
          setPayPhase('verifying')
          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            const q = new URLSearchParams()
            if (verified.orderId) {
              q.set('orderId', verified.orderId)
            }
            router.push(`/success?${q.toString()}`)
          } catch (e) {
            setPaymentError(
              e instanceof Error
                ? e.message
                : 'Payment verification failed. Contact support if money was debited.',
            )
            setPayPhase('idle')
          }
        },
        ...(Object.keys(prefill).length > 0 ? { prefill } : {}),
        theme: { color: '#3399cc' },
        modal: {
          ondismiss: () => {
            if (paymentCompletedRef.current) return
            setRazorpayOpen(false)
            setPayPhase('idle')
            setPaymentError(
              (prev) =>
                prev || 'Payment was cancelled or closed. You can try again.',
            )
          },
        },
      }

      // Window type uses `any` for Razorpay ctor (see types/razorpay.d.ts)
      const instance = new window.Razorpay(options)
      setRazorpayOpen(true)
      setPayPhase('idle')
      instance.open()
    } catch (e) {
      setRazorpayOpen(false)
      setPaymentError(
        e instanceof Error ? e.message : 'Could not start Razorpay checkout.',
      )
      setPayPhase('idle')
    }
  }, [orderIdParam, order, user, router])

  const payBusy =
    payPhase === 'creating' ||
    payPhase === 'verifying' ||
    razorpayOpen

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-gray-600 text-center text-sm">Checking session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-gray-600 text-center text-sm">
          Loading order details…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="container-custom max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Checkout</h1>
        <p className="text-gray-600 text-sm mb-8">
          Review your order, then pay securely. Payment is only confirmed after
          the server verifies the Razorpay signature.
        </p>

        {orderError && (
          <div
            className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100"
            role="alert"
          >
            {orderError}
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => void loadOrder()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry load
              </Button>
            </div>
          </div>
        )}

        {payPhase === 'verifying' && order && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 text-primary-900 text-sm px-4 py-3 border border-primary-100">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            Verifying payment on the server…
          </div>
        )}

        {order && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Package className="w-4 h-4" />
              <span>
                Order <span className="font-medium text-gray-800">{order.orderId}</span>
              </span>
            </div>
            <ul className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              {order.items.map((item) => (
                <li
                  key={item.product.id + String(item.quantity)}
                  className="flex justify-between text-sm gap-4"
                >
                  <span className="text-gray-800 line-clamp-2">
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

        {paymentError && (
          <div
            className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-900 text-sm border border-amber-100"
            role="status"
          >
            {paymentError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {order && !orderError && (
            <Button
              type="button"
              className="sm:flex-1 sm:min-h-[48px]"
              size="lg"
              disabled={
                payBusy ||
                order.status !== 'pending' ||
                (order.paymentStatus ?? 'pending') === 'success'
              }
              onClick={() => void startPayment()}
            >
              {payPhase === 'creating' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting checkout…
                </>
              ) : razorpayOpen ? (
                <>
                  <CreditCard className="w-5 h-5 mr-2 opacity-80" />
                  Complete payment in Razorpay…
                </>
              ) : payPhase === 'verifying' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay now
                </>
              )}
            </Button>
          )}
          <Link href="/orders" className="sm:flex-1">
            <Button variant="outline" className="w-full" size="lg" type="button">
              Back to orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
