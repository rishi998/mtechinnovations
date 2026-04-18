'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCatalog } from '@/lib/context/CatalogContext'
import { ProductCard } from '../shop/ProductCard'
import { Clock } from 'lucide-react'

export function DealsOfDay() {
  const { products, loading } = useCatalog()
  const dealProducts = useMemo(() => {
    const deals = products.filter((p) => p.dealOfDay)
    if (deals.length) return deals.slice(0, 4)
    const inStock = products.filter((p) => p.stock > 0).slice(0, 4)
    if (inStock.length) return inStock
    return products.slice(0, 4)
  }, [products])

  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (loading && products.length === 0) return null
  if (dealProducts.length === 0) return null

  return (
    <section className="py-10 sm:py-16 bg-gradient-to-r from-orange-500 to-red-600">
      <div className="container-custom">
        <div className="text-center text-white mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Deals of the Day</h2>
          </div>
          <p className="text-white/90 text-sm sm:text-base mb-4">
            Limited-time picks from your live catalog
          </p>
          <div className="flex items-center justify-center gap-3 text-lg font-mono font-bold">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span>:</span>
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span>:</span>
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl p-2 shadow-lg">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
