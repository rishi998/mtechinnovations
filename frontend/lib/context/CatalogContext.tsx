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
  getZohoCategories,
  deriveCategoriesFromProducts,
  mergeCategories,
} from '@/lib/api/catalog'

interface CatalogContextType {
  products: Product[]
  categories: Category[]
  loading: boolean
  error: string | null
  /** Pass `{ silent: true }` to refresh without toggling `loading` (e.g. tab focus). */
  refresh: (opts?: { silent?: boolean }) => Promise<void>
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [zohoCategories, setZohoCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (!silent) {
      setError(null)
      setLoading(true)
    }
    try {
      const [list, zohoCats] = await Promise.all([
        getProducts(),
        getZohoCategories(),
      ])
      setProducts(list)
      setZohoCategories(zohoCats)
      if (silent) setError(null)
    } catch (e) {
      setProducts([])
      setError(
        e instanceof Error ? e.message : 'Could not load products from the server.',
      )
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true })
      }
    }
    const onFocus = () => {
      void refresh({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const categories = useMemo(
    () => mergeCategories(zohoCategories, deriveCategoriesFromProducts(products)),
    [zohoCategories, products],
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
