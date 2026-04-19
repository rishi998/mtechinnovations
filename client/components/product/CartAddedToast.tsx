'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { CART_ADDED_EVENT, type CartAddedDetail } from '@/lib/cartEvents'

export function CartAddedToast() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const onAdded = (e: Event) => {
      const d = (e as CustomEvent<CartAddedDetail>).detail
      if (d?.productName) setName(d.productName)
      setOpen(true)
      window.setTimeout(() => setOpen(false), 3200)
    }
    window.addEventListener(CART_ADDED_EVENT, onAdded as EventListener)
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded as EventListener)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-[80] w-[min(92vw,380px)] -translate-x-1/2"
        >
          <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-ds-border bg-ds-surface px-4 py-3 shadow-[var(--shadow-elevated-md)]">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ds-border bg-ds-primary">
              <ShoppingBag className="h-4 w-4 text-ds-accent" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-secondary">
                Recently added to cart
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ds-text-primary">{name}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
