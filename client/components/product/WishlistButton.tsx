'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useWishlist } from '@/lib/context/WishlistContext'
import { cn } from '@/lib/utils'

type WishlistButtonProps = {
  product: Product
  className?: string
  label?: string
}

export function WishlistButton({ product, className, label }: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const active = isInWishlist(product.id)

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (active) removeFromWishlist(product.id)
      else addToWishlist(product)
    },
    [active, addToWishlist, removeFromWishlist, product],
  )

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-ds-border bg-ds-surface/95 text-ds-text-secondary shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm transition duration-250 ease-out hover:border-ds-accent/60 hover:text-ds-text-primary',
        active && 'border-ds-accent text-ds-accent',
        className,
      )}
      aria-pressed={active}
      aria-label={label ?? (active ? 'Remove from wishlist' : 'Add to wishlist')}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-current')} strokeWidth={1.75} />
    </motion.button>
  )
}
