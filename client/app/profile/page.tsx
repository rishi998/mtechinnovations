'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Package, Heart, MapPin, Settings, LogOut, Repeat } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { getOrders } from '@/lib/api'
import type { Order } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatPrice } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [ordersCount, setOrdersCount] = useState<number | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    getOrders()
      .then((orders) => {
        setOrdersCount(orders.length)
        setRecentOrders(orders.slice(0, 3))
      })
      .catch(() => {
        setOrdersCount(0)
        setRecentOrders([])
      })
  }, [isAuthenticated, user])

  if (!isAuthenticated || !user) {
    return null
  }

  const menuItems = [
    {
      icon: User,
      label: 'Account',
      description: 'Details & edit profile',
      href: '/profile/account',
      color: 'text-blue-600',
    },
    {
      icon: Package,
      label: 'My orders',
      description: 'Track and view history',
      href: '/orders',
      color: 'text-green-600',
      count: ordersCount ?? undefined,
    },
    {
      icon: Repeat,
      label: 'Buy again',
      description: 'Last 5 purchases & picks for you',
      href: '/profile/buy-again',
      color: 'text-teal-600',
    },
    { icon: Heart, label: 'Wishlist', description: 'Saved products', href: '/wishlist', color: 'text-red-600' },
    {
      icon: MapPin,
      label: 'Saved addresses',
      description: 'Shipping locations',
      href: '/profile/addresses',
      color: 'text-purple-600',
      count: user.addresses.length,
    },
    { icon: Settings, label: 'Settings', description: 'Password & preferences', href: '/profile/settings', color: 'text-ds-text-secondary' },
  ]

  return (
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-ds-inverse">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-20 sm:h-20 border border-ds-border bg-ds-surface/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold mb-1 truncate">Hello, {user.name}!</h1>
              <p className="text-ds-text-primary text-sm sm:text-base truncate">{user.email}</p>
              {user.phone && <p className="text-ds-text-primary text-sm sm:text-base">{user.phone}</p>}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card hover className="h-full">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-ds-surface flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ds-text-primary">{item.label}</h3>
                    {item.description ? (
                      <p className="text-sm text-ds-text-secondary truncate">{item.description}</p>
                    ) : null}
                    {item.count !== undefined && (
                      <p className="text-sm text-ds-text-secondary">
                        {item.href === '/orders'
                          ? `${item.count} orders`
                          : `${item.count} saved`}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-ds-text-secondary"
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
        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ds-text-primary mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/profile/account">
              <Button variant="outline">Account</Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline">My orders</Button>
            </Link>
            <Link href="/profile/buy-again">
              <Button variant="outline">Buy again</Button>
            </Link>
            <Link href="/wishlist">
              <Button variant="outline">Wishlist</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                logout()
                router.refresh()
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Recent Orders (from API) */}
        {recentOrders.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-ds-text-primary">Recent Orders</h2>
              <Link href="/orders" className="text-ds-accent hover:brightness-110 font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Card key={order.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ds-text-primary">Order #{order.orderId}</p>
                      <p className="text-sm text-ds-text-secondary">
                        {new Date(order.date).toLocaleDateString()} • {order.items.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ds-text-primary">{formatPrice(order.total)}</p>
                      <p className="text-sm text-ds-accent capitalize">{order.status}</p>
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
