'use client'

import Link from 'next/link'
import { Heart, Minus, Plus, ShoppingCart, Zap, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Product } from '@/lib/types'
import { formatPrice, calculateDiscount } from '@/lib/utils'
import { stockLabel } from '@/lib/productLabels'
import { PDP_TAX_LABEL, PDP_UNIT_LABEL, shortDescription } from '@/lib/pdpUtils'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

type ProductInfoProps = {
  product: Product
  categoryLabel: string
  categoryHref: string
  quantity: number
  onQuantityChange: (n: number) => void
  onAddToCart: () => void
  onBuyNow: () => void
  onWishlistToggle: () => void
  inWishlist: boolean
  onShare?: () => void
}

export function ProductInfo({
  product,
  categoryLabel,
  categoryHref,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  inWishlist,
  onShare,
}: ProductInfoProps) {
  const discount =
    product.originalPrice != null && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : 0
  const stock = stockLabel(product.stock)
  const lead = shortDescription(product)

  const fullStars = Math.min(5, Math.floor(product.rating))
  const hasHalf = product.rating % 1 >= 0.5 && fullStars < 5

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-ds-text-secondary">
        {product.brand}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ds-text-primary sm:text-3xl lg:text-4xl">
        {product.name}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={cn(
                'h-5 w-5',
                i < fullStars
                  ? 'fill-ds-accent text-ds-accent'
                  : i === fullStars && hasHalf
                    ? 'fill-ds-accent/50 text-ds-accent'
                    : 'text-ds-text-secondary/40',
              )}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-sm text-ds-text-secondary">
          {product.rating.toFixed(1)} · {product.reviewsCount} reviews
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold text-ds-accent sm:text-4xl">
          {formatPrice(product.price)}
        </span>
        {product.originalPrice != null && product.originalPrice > product.price && (
          <>
            <span className="text-lg text-ds-text-secondary line-through sm:text-xl">
              {formatPrice(product.originalPrice)}
            </span>
            {discount > 0 && (
              <Badge variant="warning" className="text-ds-text-primary">
                Save {discount}%
              </Badge>
            )}
          </>
        )}
      </div>

      <div className="mt-4">
        <span
          className={cn(
            'text-sm font-semibold uppercase tracking-wide',
            stock.tone === 'in' && 'text-ds-text-primary/80',
            stock.tone === 'low' && 'text-ds-accent',
            stock.tone === 'out' && 'text-ds-text-secondary',
          )}
        >
          {stock.text}
        </span>
      </div>

      {lead && (
        <p className="mt-6 text-base leading-[1.7] text-ds-text-secondary">{lead}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-y border-ds-border py-4">
        <span className="inline-flex items-center rounded-full border border-ds-border bg-ds-primary px-3 py-1 text-xs font-medium text-ds-text-primary">
          SKU: {product.sku ?? '—'}
        </span>
        <Link
          href={categoryHref}
          className="inline-flex items-center rounded-full border border-ds-border bg-ds-primary px-3 py-1 text-xs font-medium text-ds-accent transition duration-180 ease-out hover:brightness-110"
        >
          {categoryLabel}
        </Link>
        <span className="inline-flex items-center rounded-full border border-ds-border bg-ds-primary px-3 py-1 text-xs font-medium text-ds-text-primary">
          Unit: {PDP_UNIT_LABEL}
        </span>
        <span className="inline-flex items-center rounded-full border border-ds-border bg-ds-primary px-3 py-1 text-xs font-medium text-ds-text-primary">
          Tax: {PDP_TAX_LABEL}
        </span>
        <span className="inline-flex items-center rounded-full border border-ds-border bg-ds-primary px-3 py-1 text-xs font-medium text-ds-text-primary">
          {product.stock > 0 ? `Available: ${product.stock}` : 'Unavailable'}
        </span>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <span className="text-sm font-medium text-ds-text-secondary">Quantity</span>
        <div className="inline-flex items-center rounded-lg border border-ds-border bg-ds-primary">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="px-4 py-2.5 text-ds-text-primary transition duration-180 ease-out hover:bg-ds-surface disabled:opacity-40"
            disabled={product.stock <= 0}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] border-x border-ds-border py-2.5 text-center text-sm font-semibold tabular-nums text-ds-text-primary">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(Math.max(1, product.stock), quantity + 1))}
            className="px-4 py-2.5 text-ds-text-primary transition duration-180 ease-out hover:bg-ds-surface disabled:opacity-40"
            disabled={product.stock <= 0 || quantity >= product.stock}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          onClick={onAddToCart}
          disabled={product.stock === 0}
          size="lg"
          className="min-h-[48px] flex-1 uppercase tracking-wide transition duration-180 ease-out hover:scale-[1.02] sm:min-w-[200px]"
        >
          <ShoppingCart className="mr-2 h-5 w-5" strokeWidth={1.75} />
          Add to Cart
        </Button>
        <Button
          onClick={onBuyNow}
          disabled={product.stock === 0}
          size="lg"
          variant="outline"
          className="min-h-[48px] flex-1 border-2 border-ds-accent uppercase tracking-wide text-ds-accent transition duration-180 ease-out hover:scale-[1.02] hover:bg-ds-primary sm:min-w-[200px]"
        >
          <Zap className="mr-2 h-5 w-5" strokeWidth={1.75} />
          Buy Now
        </Button>
        <Button
          onClick={onWishlistToggle}
          variant="outline"
          size="lg"
          className="min-h-[48px] px-4 transition duration-180 ease-out hover:scale-[1.02]"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn('h-5 w-5', inWishlist && 'fill-ds-accent text-ds-accent')}
            strokeWidth={1.75}
          />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[48px] px-4 transition duration-180 ease-out hover:scale-[1.02]"
          onClick={onShare}
          aria-label="Share product"
        >
          <Share2 className="h-5 w-5" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  )
}
