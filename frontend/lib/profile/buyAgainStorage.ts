import type { Order } from '@/lib/types'

const STORAGE_KEY = 'ecomm:buyAgainLast5'

export type StoredPurchaseOrder = {
  orderId: string
  date: string
  items: {
    productId: string
    slug: string
    name: string
    quantity: number
  }[]
}

export type BuyAgainSnapshot = {
  userId: string
  updatedAt: string
  orders: StoredPurchaseOrder[]
}

/** Persist a trimmed snapshot of the last 5 orders for offline-friendly “Buy again” hints. */
export function saveBuyAgainSnapshot(userId: string, orders: Order[]): void {
  if (typeof window === 'undefined' || !userId) return
  const sorted = [...orders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const last5 = sorted.slice(0, 5)
  const payload: BuyAgainSnapshot = {
    userId,
    updatedAt: new Date().toISOString(),
    orders: last5.map((o) => ({
      orderId: o.orderId,
      date: new Date(o.date).toISOString(),
      items: o.items.map((line) => ({
        productId: line.product.id,
        slug: (line.product.slug ?? '').trim(),
        name: line.product.name,
        quantity: line.quantity,
      })),
    })),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

export function loadBuyAgainSnapshot(expectedUserId: string): BuyAgainSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BuyAgainSnapshot
    if (!parsed?.userId || parsed.userId !== expectedUserId) return null
    if (!Array.isArray(parsed.orders)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearBuyAgainSnapshot(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
