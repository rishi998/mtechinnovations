'use client'

import { useState, useEffect } from 'react'
import { products } from '@/lib/data/products'
import { ProductCard } from '../shop/ProductCard'
import { Clock } from 'lucide-react'

export function DealsOfDay() {
  const dealProducts = products.filter((p) => p.dealOfDay).slice(0, 4)
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

  if (dealProducts.length === 0) return null

  return (
    <section className="py-16 bg-gradient-to-r from-orange-500 to-red-600">
      <div className="container-custom">
        <div className="text-center text-white mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8" />
            <h2 className="text-3xl lg:text-4xl font-bold">Deals of the Day</h2>
          </div>
          <p className="text-xl mb-6">Limited time offers - Grab them before they're gone!</p>
          
          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-sm">Hours</div>
            </div>
            <div className="text-3xl font-bold">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-sm">Minutes</div>
            </div>
            <div className="text-3xl font-bold">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-sm">Seconds</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
