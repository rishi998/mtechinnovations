'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Repeat, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { useCatalog } from '@/lib/context/CatalogContext'
import { getOrders } from '@/lib/api'
import { saveBuyAgainSnapshot } from '@/lib/profile/buyAgainStorage'
import type { Order, Product } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { ProductCard } from '@/components/shop/ProductCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function resolveLineToProduct(line: Order['items'][0]['product'], catalog: Product[]): Product | null {
  const id = line.id?.trim()
  const slug = line.slug?.trim()
  if (slug) {
    const bySlug = catalog.find((p) => p.slug === slug)
    if (bySlug) return bySlug
  }
  if (id) {
    const byId = catalog.find((p) => p.id === id)
    if (byId) return byId
  }
  return null
}

export default function BuyAgainPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { products, loading: catalogLoading } = useCatalog()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent('/profile/buy-again'))
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    let cancelled = false
    setLoading(true)
    getOrders()
      .then((list) => {
        if (cancelled) return
        const sorted = [...list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        setOrders(sorted)
        saveBuyAgainSnapshot(user.id, sorted)
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  const lastFiveOrders = useMemo(() => orders.slice(0, 5), [orders])

  const purchasedProductIds = useMemo(() => {
    const ids = new Set<string>()
    for (const o of lastFiveOrders) {
      for (const line of o.items) {
        const id = line.product.id?.trim()
        if (id) ids.add(id)
      }
    }
    return ids
  }, [lastFiveOrders])

  const categoriesFromPurchases = useMemo(() => {
    const cats = new Set<string>()
    for (const o of lastFiveOrders) {
      for (const line of o.items) {
        const p = resolveLineToProduct(line.product, products)
        if (p?.category?.trim()) {
          cats.add(p.category.trim())
        }
      }
    }
    return cats
  }, [lastFiveOrders, products])

  const suggestedProducts = useMemo(() => {
    if (categoriesFromPurchases.size === 0 || products.length === 0) return []
    const pool = products.filter((p) => {
      if (purchasedProductIds.has(p.id)) return false
      const c = p.category?.trim()
      return !!(c && categoriesFromPurchases.has(c))
    })
    return pool
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 12)
  }, [products, categoriesFromPurchases, purchasedProductIds])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom max-w-6xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-ds-accent hover:brightness-110 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to profile
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ds-text-primary flex items-center gap-2">
            <Repeat className="w-8 h-8 text-ds-accent" />
            Buy again
          </h1>
          <p className="text-ds-text-secondary mt-2 max-w-2xl">
            Reorder from your last five purchases. We keep a snapshot on this device for quick access;
            suggestions below use your purchase categories and current catalog stock.
          </p>
        </div>

        {loading || catalogLoading ? (
          <div className="flex items-center justify-center py-24 text-ds-text-secondary gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading your orders…
          </div>
        ) : lastFiveOrders.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-ds-text-secondary mb-4">No orders yet. When you shop, your last five orders will show here.</p>
            <Link href="/">
              <Button>Start shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-ds-text-primary mb-4">Last five orders</h2>
              <div className="space-y-6">
                {lastFiveOrders.map((order) => (
                  <Card key={order.id} className="p-4 sm:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                      <div>
                        <p className="font-semibold text-ds-text-primary">Order #{order.orderId}</p>
                        <p className="text-sm text-ds-text-secondary">
                          {formatDate(order.date)} · {order.items.length} item(s) ·{' '}
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <Link
                        href={`/order-detail?orderId=${encodeURIComponent(order.orderId)}`}
                        className="text-sm font-medium text-ds-accent hover:brightness-110"
                      >
                        View order
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.map((line, idx) => {
                        const resolved = resolveLineToProduct(line.product, products)
                        if (resolved) {
                          return (
                            <div key={`${order.id}-${resolved.id}-${idx}`} className="relative">
                              <ProductCard product={resolved} />
                            </div>
                          )
                        }
                        return (
                          <div
                            key={`${order.id}-unknown-${idx}`}
                            className="rounded-xl border border-ds-border bg-ds-primary p-4 flex flex-col justify-between"
                          >
                            <div>
                              <p className="font-medium text-ds-text-primary line-clamp-2">
                                {line.product.name || 'Product'}
                              </p>
                              <p className="text-sm text-ds-text-secondary mt-1">Qty {line.quantity}</p>
                            </div>
                            <p className="text-xs text-amber-700 mt-3">
                              This item isn&apos;t in the current catalog snapshot. Open the order for
                              details or browse categories.
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {suggestedProducts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-ds-text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Suggested for you
                </h2>
                <p className="text-sm text-ds-text-secondary mb-6">
                  Based on categories in your recent purchases (excluding items you already bought).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {suggestedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
