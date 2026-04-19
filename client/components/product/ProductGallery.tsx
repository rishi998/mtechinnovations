'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'
import { firstProductImageUrl } from '@/lib/api/catalog'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

type ProductGalleryProps = {
  product: Product
  selectedIndex: number
  onSelect: (index: number) => void
  discountPercent?: number
}

export function ProductGallery({
  product,
  selectedIndex,
  onSelect,
  discountPercent = 0,
}: ProductGalleryProps) {
  const images =
    product.images?.filter((u) => typeof u === 'string' && u.trim().length > 0).length > 0
      ? product.images
      : [firstProductImageUrl(product.images)]
  const mainSrc = images[selectedIndex] ?? images[0]
  const [zoomOpen, setZoomOpen] = useState(false)

  const openZoom = useCallback(() => setZoomOpen(true), [])
  const closeZoom = useCallback(() => setZoomOpen(false), [])

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={openZoom}
          className="group relative aspect-square w-full overflow-hidden rounded-xl border border-ds-border bg-ds-primary text-left outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          aria-label="Open image zoom"
        >
          <Image
            src={mainSrc}
            alt={product.name}
            fill
            className="object-cover transition duration-250 ease-out motion-safe:group-hover:scale-[1.08]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized
            placeholder="blur"
            blurDataURL={PRODUCT_IMAGE_BLUR}
          />
          {discountPercent > 0 && (
            <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-ds-accent bg-ds-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ds-accent">
              {discountPercent}% off
            </span>
          )}
          <span className="pointer-events-none absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-ds-border bg-ds-surface/90 text-ds-text-primary backdrop-blur-sm opacity-0 transition duration-180 ease-out motion-safe:group-hover:opacity-100">
            <ZoomIn className="h-5 w-5" strokeWidth={1.75} />
          </span>
        </button>

        {images.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition duration-180 ease-out sm:h-20 sm:w-20',
                  selectedIndex === index
                    ? 'border-ds-accent ring-1 ring-ds-accent'
                    : 'border-ds-border hover:border-ds-text-secondary/40',
                )}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-250"
            onClick={closeZoom}
            aria-label="Close zoom"
          />
          <div className="relative z-10 max-h-[90vh] max-w-5xl overflow-hidden rounded-xl border border-ds-border bg-ds-surface p-2 shadow-2xl">
            <button
              type="button"
              onClick={closeZoom}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-ds-border bg-ds-primary text-ds-text-primary transition duration-180 ease-out hover:border-ds-accent"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-square w-[min(90vw,720px)]">
              <Image
                src={mainSrc}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="720px"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
