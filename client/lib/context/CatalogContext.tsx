'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product, Category } from '@/lib/types'
import {
  getProducts,
  deriveCategoriesFromProducts,
} from '@/lib/api/catalog'

interface CatalogContextType {
  products: Product[]
  categories: Category[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await getProducts()
      setProducts(list)
    } catch (e) {
      setProducts([])
      setError(
        e instanceof Error ? e.message : 'Could not load products from the server.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const categories = useMemo(
    () => deriveCategoriesFromProducts(products),
    [products],
  )

  return (
    <CatalogContext.Provider
      value={{ products, categories, loading, error, refresh }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) {
    throw new Error('useCatalog must be used within a CatalogProvider')
  }
  return ctx
}
