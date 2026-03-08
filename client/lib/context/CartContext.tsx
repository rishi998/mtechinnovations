'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Product, CartItem } from '../types'
import { useAuth } from './AuthContext'
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart } from '../api'

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  isLoading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [localCart, setLocalCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    if (isAuthenticated) {
      refreshCart()
    } else {
      setCart([])
    }
  }, [isAuthenticated, refreshCart])

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
      localStorage.setItem('cart', JSON.stringify(localCart))
    }
  }, [localCart, isAuthenticated, isLoaded])

  const displayCart = isAuthenticated ? cart : localCart

  const addToCart = async (product: Product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        const items = await apiAddToCart(product.id, quantity)
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
        const items = await apiRemoveFromCart(productId)
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
        const items = await apiUpdateCartItem(productId, quantity)
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
