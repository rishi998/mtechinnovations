'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Search, Truck, CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/context/AuthContext'

const trackingSteps = [
  { id: 1, title: 'Order Placed', description: 'Your order has been received', icon: CheckCircle },
  { id: 2, title: 'Processing', description: 'Order is being prepared for dispatch', icon: Package },
  { id: 3, title: 'Shipped', description: 'Your order is on the way', icon: Truck },
  { id: 4, title: 'Out for Delivery', description: 'Your order is out for delivery', icon: MapPin },
  { id: 5, title: 'Delivered', description: 'Order delivered successfully', icon: CheckCircle },
]

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState('')
  const [trackedOrder, setTrackedOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingId.trim()) return

    setError('')
    setIsSearching(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Search in user orders
    if (isAuthenticated && user) {
      const order = user.orders.find(
        (o) => o.trackingId === trackingId.trim() || o.orderId === trackingId.trim()
      )
      if (order) {
        setTrackedOrder(order)
        setIsSearching(false)
        return
      }
    }

    setError('No order found with this tracking ID. Please check and try again.')
    setTrackedOrder(null)
    setIsSearching(false)
  }

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1
      case 'processing': return 2
      case 'shipped': return 3
      case 'delivered': return 5
      case 'cancelled': return 0
      default: return 1
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container-custom max-w-3xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Truck className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your Order ID or Tracking ID to check the status of your order
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <Input
              label="Order ID or Tracking ID"
              placeholder="e.g., ORD123456 or TRK789012"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" isLoading={isSearching}>
              <Search className="w-5 h-5 mr-2" />
              Track Order
            </Button>
          </form>
        </div>

        {/* Tracking Result */}
        {trackedOrder && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Order #{trackedOrder.orderId}</h2>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(trackedOrder.date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  trackedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  trackedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  trackedOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  trackedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {trackedOrder.status}
                </span>
                {trackedOrder.trackingId && (
                  <p className="text-xs text-gray-500 mt-1">Tracking: {trackedOrder.trackingId}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
              <div className="space-y-3">
                {trackedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {trackedOrder.status !== 'cancelled' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Tracking Timeline</h3>
                <div className="relative">
                  {trackingSteps.map((step, index) => {
                    const currentStep = getStatusStep(trackedOrder.status)
                    const isCompleted = step.id <= currentStep
                    const isCurrent = step.id === currentStep

                    return (
                      <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                          }`}>
                            <step.icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          {index < trackingSteps.length - 1 && (
                            <div className={`w-0.5 flex-1 mt-1 ${isCompleted ? 'bg-primary-600' : 'bg-gray-200'}`} style={{ minHeight: '24px' }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-1">
                          <p className={`font-medium text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.title}
                            {isCurrent && <span className="ml-2 text-xs text-primary-600 font-semibold">← Current</span>}
                          </p>
                          <p className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {trackedOrder.status === 'cancelled' && (
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <p className="text-red-700 font-medium">This order has been cancelled.</p>
                <p className="text-red-600 text-sm mt-1">If you paid for this order, a refund has been initiated.</p>
              </div>
            )}
          </div>
        )}

        {/* User Orders Quick Access */}
        {isAuthenticated && user && user.orders.length > 0 && !trackedOrder && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="font-bold text-gray-900 mb-4">Your Recent Orders</h2>
            <div className="space-y-3">
              {user.orders.slice(0, 3).map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setTrackingId(order.trackingId ?? order.orderId)
                    setTrackedOrder(order)
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Order #{order.orderId}</p>
                    <p className="text-xs text-gray-500 capitalize">{order.status} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/orders" className="text-sm text-primary-600 hover:underline font-medium">
                View All Orders →
              </Link>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-blue-50 rounded-2xl p-6 text-center">
            <p className="text-blue-900 font-medium mb-2">Login to track your orders easily</p>
            <p className="text-blue-700 text-sm mb-4">Sign in to see all your order statuses in one place</p>
            <Link href="/login">
              <Button variant="outline" size="sm">Login to Your Account</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
