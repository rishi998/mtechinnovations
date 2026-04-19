'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import type { Product } from '@/lib/types'
import { firstProductImageUrl } from '@/lib/api/catalog'
import { formatPrice } from '@/lib/utils'
import { productPath } from '@/lib/paths'
import { useCart } from '@/lib/context/CartContext'
import { dispatchCartAdded } from '@/lib/cartEvents'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'
import { Button } from '@/components/ui/Button'

type QuickViewModalProps = {
  product: Product | null
  onClose: () => void
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (product) setQty(1)
  }, [product])

  const maxQty = product ? Math.max(1, product.stock) : 1

  const bump = useCallback(
    (delta: number) => {
      setQty((q) => {
        const n = q + delta
        if (n < 1) return 1
        if (n > maxQty) return maxQty
        return n
      })
    },
    [maxQty],
  )

  const handleAdd = useCallback(async () => {
    if (!product || product.stock <= 0) return
    setAdding(true)
    try {
      await addToCart(product, qty)
      dispatchCartAdded(product.name)
      onClose()
    } finally {
      setAdding(false)
    }
  }, [addToCart, product, qty, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (product) {
      document.addEventListener('keydown', onKey)
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', onKey)
        document.body.style.overflow = prev
      }
    }
  }, [product, onClose])

  return (
    <AnimatePresence mode="wait">
      {product && (
        <motion.div
          key={product.id}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-ds-overlay/60 backdrop-blur-sm"
            aria-label="Close quick view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />
          <motion.div
            className="relative grid max-h-[90vh] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-ds-border bg-ds-surface shadow-[var(--shadow-elevated-lg)] md:grid-cols-2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-square bg-ds-primary md:aspect-auto md:min-h-[320px]">
              <Image
                src={firstProductImageUrl(product.images)}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={PRODUCT_IMAGE_BLUR}
              />
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto p-6 md:p-8">
              <h2 id="quick-view-title" className="text-xl font-semibold text-ds-text-primary md:text-2xl">
                {product.name}
              </h2>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold text-ds-accent">{formatPrice(product.price)}</span>
                {product.originalPrice != null && product.originalPrice > product.price && (
                  <span className="text-sm text-ds-text-secondary line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-ds-text-secondary line-clamp-4">
                {product.description}
              </p>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-ds-text-secondary">
                  Qty
                </span>
                <div className="inline-flex items-center rounded-lg border border-ds-border bg-ds-primary">
                  <button
                    type="button"
                    className="p-2 text-ds-text-primary transition duration-180 ease-out hover:bg-ds-surface disabled:opacity-40"
                    onClick={() => bump(-1)}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-ds-text-primary">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="p-2 text-ds-text-primary transition duration-180 ease-out hover:bg-ds-surface disabled:opacity-40"
                    onClick={() => bump(1)}
                    disabled={qty >= maxQty || product.stock <= 0}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-2">
                <Button
                  type="button"
                  className="w-full uppercase tracking-wide"
                  disabled={product.stock <= 0}
                  isLoading={adding}
                  onClick={handleAdd}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Link
                  href={productPath(product.slug, product.id)}
                  onClick={onClose}
                  className="text-center text-sm font-medium text-ds-text-secondary underline-offset-4 transition duration-180 ease-out hover:text-ds-text-primary hover:underline"
                >
                  View full details
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
