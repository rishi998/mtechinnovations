'use client'

import { useCallback, useId, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, ShoppingCart, Star } from 'lucide-react'
import type { Product } from '@/lib/types'
import { firstProductImageUrl } from '@/lib/api/catalog'
import { calculateDiscount, formatPrice, cn } from '@/lib/utils'
import { productPath } from '@/lib/paths'
import { useCart } from '@/lib/context/CartContext'
import { dispatchCartAdded } from '@/lib/cartEvents'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'
import {
  getProductRibbons,
  hasFreeShipping,
  ribbonLabel,
  specChips,
  stockLabel,
} from '@/lib/productLabels'
import { WishlistButton } from './WishlistButton'

type ProductCardProps = {
  product: Product
  variant?: 'default' | 'compact'
  onQuickView?: (product: Product) => void
}

type Ripple = { id: string; x: number; y: number }

export function ProductCard({ product, variant = 'default', onQuickView }: ProductCardProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const [cartPhase, setCartPhase] = useState<'idle' | 'loading' | 'success'>('idle')
  const rippleId = useId()
  const [ripples, setRipples] = useState<Ripple[]>([])

  const img = firstProductImageUrl(product.images)
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : 0
  const stock = stockLabel(product.stock)
  const chips = specChips(product, variant === 'compact' ? 2 : 3)
  const ribbons = getProductRibbons(product).slice(0, 2)
  const freeShip = hasFreeShipping(product)

  const handleAdd = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (product.stock <= 0 || cartPhase === 'loading') return
      setCartPhase('loading')
      try {
        await addToCart(product, 1)
        dispatchCartAdded(product.name)
        setCartPhase('success')
        window.setTimeout(() => setCartPhase('idle'), 1800)
      } catch {
        setCartPhase('idle')
      }
    },
    [addToCart, product, cartPhase],
  )

  const onRipple = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const id = `${rippleId}-${Date.now()}`
      setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
      window.setTimeout(() => setRipples((prev) => prev.filter((p) => p.id !== id)), 650)
    },
    [rippleId],
  )

  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (onQuickView) onQuickView(product)
      else router.push(productPath(product.slug, product.id))
    },
    [onQuickView, product, router],
  )

  const compact = variant === 'compact'

  return (
    <div
      className={cn(
        'group/card relative flex flex-col overflow-hidden rounded-xl border border-ds-border bg-ds-surface',
        'transition duration-250 ease-out will-change-transform',
        'hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(0,0,0,0.38)]',
        'hover:[transform:perspective(960px)_rotateX(0.5deg)_rotateY(-0.5deg)]',
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ds-primary">
        <Link
          href={productPath(product.slug, product.id)}
          className="absolute inset-0 z-[1]"
          aria-label={product.name}
        >
          <Image
            src={img}
            alt={product.name}
            fill
            className="object-cover transition duration-250 ease-out group-hover/card:scale-[1.05]"
            sizes={compact ? '(max-width: 768px) 40vw, 280px' : '(max-width: 768px) 100vw, 25vw'}
            placeholder="blur"
            blurDataURL={PRODUCT_IMAGE_BLUR}
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex justify-between gap-2 p-3">
          <div className="flex max-w-[70%] flex-col gap-1.5">
            {ribbons.map((r) => (
              <span
                key={r}
                className="inline-flex w-fit rounded-md border border-ds-border bg-ds-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-text-primary"
              >
                {ribbonLabel(r)}
              </span>
            ))}
            {discountPct > 0 && (
              <span className="inline-flex w-fit rounded-md border border-ds-border bg-ds-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-accent">
                {discountPct}% off
              </span>
            )}
          </div>
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <WishlistButton product={product} className="opacity-100 md:opacity-0 md:group-hover/card:opacity-100" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-ds-primary/0 transition duration-250 ease-out group-hover/card:bg-ds-primary/35">
          <button
            type="button"
            onClick={handleQuickView}
            className={cn(
              'pointer-events-auto inline-flex items-center gap-2 rounded-full border border-ds-border bg-ds-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ds-text-primary shadow-lg transition duration-250 ease-out',
              'opacity-100 md:opacity-0 md:group-hover/card:opacity-100',
            )}
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} />
            Quick View
          </button>
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col', compact ? 'p-3' : 'p-4')}>
        <Link
          href={productPath(product.slug, product.id)}
          className={cn(
            'font-semibold text-ds-text-primary transition duration-180 ease-out hover:text-ds-text-primary/90',
            compact ? 'line-clamp-1 text-sm' : 'line-clamp-2 min-h-[2.75rem] text-base leading-snug',
          )}
        >
          {product.name}
        </Link>

        {!compact && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ds-text-secondary">
            {product.description}
          </p>
        )}

        {chips.length > 0 && (
          <p
            className={cn(
              'mt-2 font-mono text-[11px] leading-relaxed text-ds-text-secondary',
              compact ? 'line-clamp-1' : 'line-clamp-2',
            )}
          >
            {chips.join(' · ')}
          </p>
        )}

        <div className={cn('mt-3 flex flex-wrap items-center gap-x-3 gap-y-1', compact && 'mt-2')}>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-ds-accent text-ds-accent" aria-hidden />
            <span className="text-sm font-medium tabular-nums text-ds-text-primary">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-ds-text-secondary">({product.reviewsCount})</span>
          </div>
          <span
            className={cn(
              'text-[11px] font-medium uppercase tracking-wide',
              stock.tone === 'in' && 'text-ds-text-primary/75',
              stock.tone === 'low' && 'text-ds-accent',
              stock.tone === 'out' && 'text-ds-text-secondary',
            )}
          >
            {stock.text}
          </span>
          {freeShip && (
            <span className="rounded-full border border-ds-border bg-ds-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-text-primary">
              Free Shipping
            </span>
          )}
        </div>

        <div className={cn('mt-4 flex flex-wrap items-baseline gap-2', compact && 'mt-3')}>
          <span className={cn('font-bold text-ds-accent', compact ? 'text-base' : 'text-lg')}>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice != null && product.originalPrice > product.price && (
            <span className="text-sm text-ds-text-secondary line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <div className={cn('mt-4 flex flex-col gap-2', compact && 'mt-3')}>
          <Link
            href={productPath(product.slug, product.id)}
            className={cn(
              'inline-flex w-full items-center justify-center rounded-lg border-2 border-ds-accent bg-transparent py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ds-accent transition duration-180 ease-out hover:bg-ds-surface',
              compact && 'py-2 text-[11px]',
            )}
          >
            View Details
          </Link>

          <button
            type="button"
            onPointerDown={onRipple}
            onClick={handleAdd}
            disabled={product.stock <= 0 || cartPhase === 'loading'}
            className={cn(
              'relative w-full overflow-hidden rounded-lg border border-ds-border bg-ds-primary py-3 text-sm font-semibold uppercase tracking-wide text-ds-text-primary transition duration-180 ease-out',
              'hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50',
              cartPhase === 'success' && 'motion-safe:animate-btn-success-pop border-ds-accent bg-ds-accent',
            )}
          >
            {ripples.map((r) => (
              <span
                key={r.id}
                className="pointer-events-none absolute h-3 w-3 rounded-full bg-ds-light motion-safe:animate-ripple"
                style={{ left: r.x, top: r.y }}
              />
            ))}
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {cartPhase === 'loading' ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Adding…
                </>
              ) : cartPhase === 'success' ? (
                <>Added ✓</>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
