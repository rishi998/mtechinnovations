'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Search, Truck, CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/context/AuthContext'
import { getOrders } from '@/lib/api'
import type { Order } from '@/lib/types'

const trackingSteps = [
  { id: 1, title: 'Order Placed', description: 'Your order has been received', icon: CheckCircle },
  { id: 2, title: 'Processing', description: 'Order is being prepared for dispatch', icon: Package },
  { id: 3, title: 'Shipped', description: 'Your order is on the way', icon: Truck },
  { id: 4, title: 'Out for Delivery', description: 'Your order is out for delivery', icon: MapPin },
  { id: 5, title: 'Delivered', description: 'Order delivered successfully', icon: CheckCircle },
]

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState('')
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null)
  const [ordersList, setOrdersList] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return
    getOrders()
      .then(setOrdersList)
      .catch(() => setOrdersList([]))
  }, [isAuthenticated])

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingId.trim()) return

    setError('')
    setIsSearching(true)

    if (isAuthenticated) {
      try {
        const orders = ordersList.length > 0 ? ordersList : await getOrders()
        if (orders.length > 0 && ordersList.length === 0) setOrdersList(orders)
        const order = orders.find(
          (o) =>
            o.trackingId === trackingId.trim() ||
            o.orderId === trackingId.trim()
        )
        if (order) {
          setTrackedOrder(order)
          setIsSearching(false)
          return
        }
      } catch {
        setError('Could not load orders. Please try again.')
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
    <div className="min-h-screen bg-ds-primary py-8 sm:py-12">
      <div className="container-custom max-w-3xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-accent mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ds-surface rounded-full mb-4">
            <Truck className="w-8 h-8 text-ds-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ds-text-primary mb-2">Track Your Order</h1>
          <p className="text-ds-text-secondary">
            Enter your Order ID or Tracking ID to check the status of your order
          </p>
        </div>

        {/* Search Form */}
        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
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
          <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b">
              <div>
                <h2 className="font-bold text-ds-text-primary text-lg">Order #{trackedOrder.orderId}</h2>
                <p className="text-sm text-ds-text-secondary">
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
                  'bg-ds-surface text-ds-text-secondary'
                }`}>
                  {trackedOrder.status}
                </span>
                {trackedOrder.trackingId && (
                  <p className="text-xs text-ds-text-secondary mt-1">Tracking: {trackedOrder.trackingId}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-ds-text-primary mb-3">Items Ordered</h3>
              <div className="space-y-3">
                {trackedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ds-surface rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ds-text-primary truncate">{item.product.name}</p>
                      <p className="text-xs text-ds-text-secondary">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {trackedOrder.status !== 'cancelled' && (
              <div>
                <h3 className="font-semibold text-ds-text-primary mb-4">Tracking Timeline</h3>
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
                            isCompleted ? 'bg-ds-accent' : 'bg-ds-surface'
                          }`}>
                            <step.icon className={`w-4 h-4 ${isCompleted ? 'text-ds-inverse' : 'text-ds-text-secondary'}`} />
                          </div>
                          {index < trackingSteps.length - 1 && (
                            <div className={`w-0.5 flex-1 mt-1 ${isCompleted ? 'bg-ds-accent' : 'bg-ds-surface'}`} style={{ minHeight: '24px' }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-1">
                          <p className={`font-medium text-sm ${isCompleted ? 'text-ds-text-primary' : 'text-ds-text-secondary'}`}>
                            {step.title}
                            {isCurrent && <span className="ml-2 text-xs text-ds-accent font-semibold">← Current</span>}
                          </p>
                          <p className={`text-xs mt-0.5 ${isCompleted ? 'text-ds-text-secondary' : 'text-ds-text-secondary'}`}>
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
        {isAuthenticated && ordersList.length > 0 && !trackedOrder && (
          <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="font-bold text-ds-text-primary mb-4">Your Recent Orders</h2>
            <div className="space-y-3">
              {ordersList.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setTrackingId(order.trackingId ?? order.orderId)
                    setTrackedOrder(order)
                  }}
                  className="w-full flex items-center justify-between p-3 bg-ds-primary rounded-xl hover:bg-ds-primary transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-ds-text-primary text-sm">Order #{order.orderId}</p>
                    <p className="text-xs text-ds-text-secondary capitalize">{order.status} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <Clock className="w-4 h-4 text-ds-text-secondary" />
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/orders" className="text-sm text-ds-accent hover:underline font-medium">
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
