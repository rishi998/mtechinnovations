import { api } from './client'
import { resolveCatalogImageUrl } from './catalog'
import type { Product, CartItem } from '@/lib/types'

interface ServerCartItem {
  productId: Product | { _id: string; [k: string]: unknown }
  quantity: number
}

interface ServerCart {
  _id: string
  userId: string
  items: ServerCartItem[]
}

function mapCartItem(i: ServerCartItem): CartItem {
  const product = typeof i.productId === 'object' && i.productId !== null
    ? (i.productId as Product & { _id?: string })
    : null
  const productId = product?._id ?? (i.productId as unknown as string)
  const p: Product = product
    ? {
        id: product._id ?? product.id ?? productId,
        name: product.name,
        slug: product.slug ?? '',
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        images: Array.isArray(product.images)
          ? product.images
              .filter((u) => typeof u === 'string' && u.length > 0)
              .map((u) => resolveCatalogImageUrl(u))
          : [],
        rating: product.rating ?? 0,
        reviewsCount: product.reviewsCount ?? 0,
        stock: product.stock ?? 0,
        description: product.description ?? '',
        specs: product.specs ?? {},
        tags: product.tags ?? [],
        brand: product.brand,
        featured: product.featured,
        trending: product.trending,
        dealOfDay: product.dealOfDay,
        isNewLaunch: product.isNewLaunch,
        sku: product.sku,
      }
    : ({} as Product)
  return { product: p, quantity: i.quantity }
}

export async function getCart(): Promise<CartItem[]> {
  const cart = await api.get<ServerCart>('/cart')
  return (cart.items || []).map(mapCartItem)
}

export async function addToCart(productId: string, quantity = 1): Promise<CartItem[]> {
  const cart = await api.post<ServerCart>('/cart/add', { productId, quantity })
  return (cart.items || []).map(mapCartItem)
}

export async function updateCartItem(productId: string, quantity: number): Promise<CartItem[]> {
  const cart = await api.patch<ServerCart>('/cart/update', { productId, quantity })
  return (cart.items || []).map(mapCartItem)
}

export async function removeFromCart(productId: string): Promise<CartItem[]> {
  const cart = await api.delete<ServerCart>(`/cart/remove/${productId}`)
  return (cart.items || []).map(mapCartItem)
}
