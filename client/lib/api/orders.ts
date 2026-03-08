import { api } from './client'
import type { Order, CartItem, Address } from '@/lib/types'

interface ServerOrderItem {
  productId: { _id: string; name: string; price: number; [k: string]: unknown } | string
  quantity: number
  price: number
}

interface ServerOrder {
  _id: string
  id?: string
  orderId: string
  userId: string
  status: string
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  shippingAddress: Record<string, string>
  paymentMethod: string
  trackingId?: string | null
  createdAt: string
  items: ServerOrderItem[]
}

function mapOrder(o: ServerOrder): Order {
  const items: CartItem[] = (o.items || []).map((i) => {
    const product = typeof i.productId === 'object' && i.productId !== null
      ? (i.productId as { _id: string; name: string; price: number })
      : null
    return {
      product: {
        id: product?._id ?? '',
        name: product?.name ?? '',
        slug: '',
        category: '',
        subcategory: '',
        price: product?.price ?? i.price,
        images: [],
        rating: 0,
        reviewsCount: 0,
        stock: 0,
        description: '',
        specs: {},
        tags: [],
        brand: '',
      },
      quantity: i.quantity,
    }
  })
  const shippingAddress = o.shippingAddress as Address
  if (shippingAddress && !shippingAddress.id) {
    (shippingAddress as Address & { id?: string }).id = (o as unknown as { shippingAddress?: { id?: string } }).shippingAddress?.id ?? ''
  }
  return {
    id: o._id,
    orderId: o.orderId,
    date: new Date(o.createdAt),
    status: o.status as Order['status'],
    items,
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    shipping: o.shipping,
    total: o.total,
    shippingAddress: shippingAddress ?? ({} as Address),
    paymentMethod: o.paymentMethod,
    trackingId: o.trackingId ?? undefined,
  }
}

export interface CreateOrderPayload {
  shippingAddress: {
    name: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
  }
  paymentMethod?: string
  discount?: number
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await api.post<ServerOrder>('/orders', payload)
  return mapOrder(res)
}

export async function getOrders(): Promise<Order[]> {
  const list = await api.get<ServerOrder[]>('/orders')
  return (list || []).map(mapOrder)
}

export async function getOrderById(orderId: string): Promise<Order> {
  const res = await api.get<ServerOrder>(`/orders/${orderId}`)
  return mapOrder(res)
}
