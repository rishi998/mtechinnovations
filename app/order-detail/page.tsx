'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  MapPin,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'

const trackingSteps = [
  { status: 'pending', label: 'Order Placed', description: 'We have received your order', icon: CheckCircle },
  { status: 'processing', label: 'Processing', description: 'Your order is being packed', icon: Package },
  { status: 'shipped', label: 'Shipped', description: 'Your order is on the way', icon: Truck },
  { status: 'delivered', label: 'Delivered', description: 'Order delivered successfully', icon: MapPin },
]

const statusOrder = ['pending', 'processing', 'shipped', 'delivered']

function getStatusVariant(status: string): 'success' | 'info' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'delivered': return 'success'
    case 'processing': return 'info'
    case 'shipped': return 'warning'
    case 'cancelled': return 'danger'
    default: return 'default'
  }
}

function OrderDetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) return null

  const order = user.orders.find((o) => o.orderId === orderId)

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find an order with ID &quot;{orderId}&quot;. Please check your orders list.
            </p>
            <Link href="/orders">
              <Button size="lg">View All Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentStepIndex = order.status === 'cancelled'
    ? -1
    : statusOrder.indexOf(order.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        {/* Back Link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
                <Badge variant={getStatusVariant(order.status)} size="sm" className="capitalize">
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {formatDate(order.date)} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
              {order.trackingId && (
                <p className="text-sm text-primary-600 mt-1">
                  Tracking ID: <span className="font-medium">{order.trackingId}</span>
                </p>
              )}
            </div>
            <Link href="/track">
              <Button variant="outline" size="sm">
                <Truck className="w-4 h-4 mr-2" />
                Track Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Tracking Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-5">Order Status</h2>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 hidden sm:block" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary-600 hidden sm:block transition-all"
                style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` : '0%' }}
              />

              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0 relative">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step.status} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                        isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                      }`}>
                        <step.icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div className="sm:text-center">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-1 text-xs text-primary-600 font-semibold sm:hidden">(Now)</span>}
                        </p>
                        <p className={`text-xs mt-0.5 hidden sm:block ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Order Cancelled</h3>
                <p className="text-sm text-red-700 mt-1">
                  This order has been cancelled. If you were charged, a refund will be initiated within 5-7 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4 divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className={`flex gap-4 ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {item.product.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2 text-sm sm:text-base"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{item.product.brand}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">{formatPrice(item.product.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && order.shippingAddress.name && (
              <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  Shipping Address
                </h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{order.shippingAddress.name}</p>
                  <p className="text-gray-500">{order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-500" />
                Payment
              </h2>
              <p className="text-sm text-gray-700 capitalize">
                {order.paymentMethod === 'card'
                  ? 'Credit / Debit Card'
                  : order.paymentMethod === 'upi'
                  ? 'UPI'
                  : order.paymentMethod === 'netbanking'
                  ? 'Net Banking'
                  : order.paymentMethod}
              </p>
              <p className="text-xs text-gray-500 mt-1">Payment successful</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Need Help?
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Issues with your order? Contact our support team.
              </p>
              <Link href="/contact">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  )
}
