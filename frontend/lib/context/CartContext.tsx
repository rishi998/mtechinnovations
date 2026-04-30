'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { Product, CartItem } from '../types'

import { useAuth } from './AuthContext'
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart } from '../api'
import { APP_LOGOUT_EVENT } from '@/lib/cartEvents'

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  isLoading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

/** Prefer slug for `/api/cart/*` so Mongo lookup works (mock numeric `id` is not an ObjectId). */
function productRefForApi(p: Pick<Product, 'id' | 'slug'>): string {
  const s = p.slug?.trim()
  if (s) return s
  return p.id
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [localCart, setLocalCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const localCartRef = useRef(localCart)
  localCartRef.current = localCart
  /** Stops duplicate guest→server merge when the login effect runs twice (e.g. React Strict Mode). */
  const guestMergedRef = useRef(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const items = await getCart()
      setCart(items)
    } catch {
      setCart([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const onLogout = () => {
      setLocalCart([])
      setCart([])
    }
    window.addEventListener(APP_LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(APP_LOGOUT_EVENT, onLogout)
  }, [])

  /** When logged in: merge guest cart into server, then load server cart. */
  useEffect(() => {
    if (!isAuthenticated) {
      guestMergedRef.current = false
      setCart([])
      return
    }
    let cancelled = false
    const sync = async () => {
      setIsLoading(true)
      let guestSnapshot: CartItem[] = []
      if (!guestMergedRef.current && localCartRef.current.length > 0) {
        guestMergedRef.current = true
        guestSnapshot = [...localCartRef.current]
        setLocalCart([])
      }
      try {
        if (guestSnapshot.length > 0) {
          for (const item of guestSnapshot) {
            try {
              await apiAddToCart(productRefForApi(item.product), item.quantity)
            } catch {
              // product id may not exist on server; skip
            }
          }
        }
        const items = await getCart()
        if (!cancelled) setCart(items)
      } catch {
        if (!cancelled) setCart([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void sync()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) return
    const saved = localStorage.getItem('cart')
    if (saved) {
      try {
        setLocalCart(JSON.parse(saved))
      } catch {}
    }
    setIsLoaded(true)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated && isLoaded) {
      try {
        if (localCart.length === 0) {
          localStorage.removeItem('cart')
        } else {
          localStorage.setItem('cart', JSON.stringify(localCart))
        }
      } catch {
        /* ignore */
      }
    }
  }, [localCart, isAuthenticated, isLoaded])

  const displayCart = isAuthenticated ? cart : localCart

  const addToCart = async (product: Product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        const items = await apiAddToCart(productRefForApi(product), quantity)
        setCart(items)
      } catch {
        // fallback: add locally for UX
        setCart((prev) => {
          const existing = prev.find((i) => i.product.id === product.id)
          if (existing) {
            return prev.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            )
          }
          return [...prev, { product, quantity }]
        })
      }
    } else {
      setLocalCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id)
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
          )
        }
        return [...prev, { product, quantity }]
      })
    }
  }

  const removeFromCart = async (productId: string) => {
    if (isAuthenticated) {
      try {
        const line = cart.find(
          (i) => i.product.id === productId || i.product.slug === productId,
        )
        const ref = line ? productRefForApi(line.product) : productId
        const items = await apiRemoveFromCart(ref)
        setCart(items)
      } catch {
        setCart((prev) => prev.filter((i) => i.product.id !== productId))
      }
    } else {
      setLocalCart((prev) => prev.filter((i) => i.product.id !== productId))
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    if (isAuthenticated) {
      try {
        const line = cart.find(
          (i) => i.product.id === productId || i.product.slug === productId,
        )
        const ref = line ? productRefForApi(line.product) : productId
        const items = await apiUpdateCartItem(ref, quantity)
        setCart(items)
      } catch {
        setCart((prev) =>
          prev.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          )
        )
      }
    } else {
      setLocalCart((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        )
      )
    }
  }

  const clearCart = () => {
    setCart([])
    setLocalCart([])
  }

  const cartTotal = displayCart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  )
  const cartCount = displayCart.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart: displayCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isLoading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
