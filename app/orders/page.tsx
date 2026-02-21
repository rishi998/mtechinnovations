'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatDate, formatPrice } from '@/lib/utils'

export default function OrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success'
      case 'processing':
        return 'info'
      case 'shipped':
        return 'warning'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  if (user.orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">No Orders Yet</h1>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping!
            </p>
            <Link href="/">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600 mb-8">{user.orders.length} orders placed</p>

        <div className="space-y-4">
          {user.orders
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                      <Badge variant={getStatusVariant(order.status)} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Placed on {formatDate(order.date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} • Total: {formatPrice(order.total)}
                    </p>
                    {order.trackingId && (
                      <p className="text-sm text-primary-600 mt-1">
                        Tracking ID: {order.trackingId}
                      </p>
                    )}
                  </div>

                  {/* Products Preview */}
                  <div className="flex gap-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"
                        title={item.product.name}
                      />
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/order/${order.orderId}`}>
                      <Button variant="outline" size="sm">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
