'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Package, Heart, MapPin, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  const menuItems = [
    { icon: User, label: 'Personal Information', href: '/profile/edit', color: 'text-blue-600' },
    { icon: Package, label: 'My Orders', href: '/orders', color: 'text-green-600', count: user.orders.length },
    { icon: Heart, label: 'Wishlist', href: '/wishlist', color: 'text-red-600' },
    { icon: MapPin, label: 'Saved Addresses', href: '/profile/addresses', color: 'text-purple-600', count: user.addresses.length },
    { icon: Settings, label: 'Account Settings', href: '/profile/settings', color: 'text-gray-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold mb-1 truncate">Hello, {user.name}!</h1>
              <p className="text-primary-100 text-sm sm:text-base truncate">{user.email}</p>
              {user.phone && <p className="text-primary-100 text-sm sm:text-base">{user.phone}</p>}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card hover className="h-full">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    {item.count !== undefined && (
                      <p className="text-sm text-gray-500">{item.count} items</p>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/orders">
              <Button variant="outline">Track Orders</Button>
            </Link>
            <Link href="/wishlist">
              <Button variant="outline">View Wishlist</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        {user.orders.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
              <Link href="/orders" className="text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {user.orders.slice(0, 3).map((order) => (
                <Card key={order.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.orderId}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.date).toLocaleDateString()} • {order.items.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{order.total}</p>
                      <p className="text-sm text-primary-600 capitalize">{order.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
