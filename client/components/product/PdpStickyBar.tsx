'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { firstProductImageUrl } from '@/lib/api/catalog'

type PdpStickyBarProps = {
  product: Product
  visible: boolean
  quantity: number
  onAddToCart: () => void
}

export function PdpStickyBar({ product, visible, quantity, onAddToCart }: PdpStickyBarProps) {
  if (!visible) return null

  const img = firstProductImageUrl(product.images)

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ds-border bg-ds-surface/95 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
      role="region"
      aria-label="Quick add to cart"
    >
      <div className="container-custom flex items-center gap-3 sm:gap-6">
        <Link href={`#pdp-hero`} className="hidden min-w-0 shrink sm:flex sm:items-center sm:gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-ds-border bg-ds-primary">
            <Image src={img} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
          </span>
          <span className="truncate text-sm font-medium text-ds-text-primary">{product.name}</span>
        </Link>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <span className="text-lg font-bold tabular-nums text-ds-accent">{formatPrice(product.price)}</span>
          <span className="hidden text-xs text-ds-text-secondary sm:inline">Qty {quantity}</span>
          <Button
            onClick={onAddToCart}
            disabled={product.stock === 0}
            size="sm"
            className="shrink-0 uppercase tracking-wide transition duration-180 ease-out hover:scale-[1.02]"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
