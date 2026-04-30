'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Product, WishlistItem } from '../types'
import { APP_LOGOUT_EVENT } from '@/lib/cartEvents'

interface WishlistContextType {
  wishlist: WishlistItem[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      try {
        const parsed = JSON.parse(savedWishlist) as WishlistItem[]
        if (Array.isArray(parsed)) {
          setWishlist(
            parsed.map((item) => ({
              ...item,
              addedAt: item.addedAt ? new Date(item.addedAt as unknown as string) : new Date(),
            }))
          )
        }
      } catch {
        setWishlist([])
      }
    }
    setIsLoaded(true)
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return
    try {
      if (wishlist.length === 0) {
        localStorage.removeItem('wishlist')
      } else {
        localStorage.setItem('wishlist', JSON.stringify(wishlist))
      }
    } catch {
      /* ignore */
    }
  }, [wishlist, isLoaded])

  useEffect(() => {
    const onLogout = () => setWishlist([])
    window.addEventListener(APP_LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(APP_LOGOUT_EVENT, onLogout)
  }, [])

  const addToWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.find((item) => item.product.id === product.id)
      if (exists) return prevWishlist
      
      return [...prevWishlist, { product, addedAt: new Date() }]
    })
  }

  const removeFromWishlist = (productId: string) => {
    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => item.product.id !== productId)
    )
  }

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.product.id === productId)
  }

  const wishlistCount = wishlist.length

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
