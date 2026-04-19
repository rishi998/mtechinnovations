'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCatalog } from '@/lib/context/CatalogContext'
import { getProductBySlugOrId } from '@/lib/api/catalog'
import {
  productBelongsToCategoryPage,
  storefrontCategorySlugForProduct,
} from '@/lib/categoryRouting'
import { categories as staticCategories } from '@/lib/data/categories'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/context/CartContext'
import { useWishlist } from '@/lib/context/WishlistContext'
import { calculateDiscount } from '@/lib/utils'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductDescription } from '@/components/product/ProductDescription'
import { ProductSpecs } from '@/components/product/ProductSpecs'
import { ProductShipping } from '@/components/product/ProductShipping'
import { PDPTrustRow } from '@/components/product/PDPTrustRow'
import { ProductReviewsMock } from '@/components/product/ProductReviewsMock'
import { SimilarProducts } from '@/components/product/SimilarProducts'
import { RecommendedProducts } from '@/components/product/RecommendedProducts'
import { PdpStickyBar } from '@/components/product/PdpStickyBar'
import { cn } from '@/lib/utils'

export default function ProductPageClient({ slug }: { slug: string }) {
  const router = useRouter()
  const { products: catalogProducts, loading: catalogLoading } = useCatalog()
  const [product, setProduct] = useState<Product | null>(null)
  const [fetching, setFetching] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [stickyVisible, setStickyVisible] = useState(false)

  const heroSentinelRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    let cancelled = false
    const fromList = catalogProducts.find((p) => p.slug === slug)

    if (fromList) {
      setProduct(fromList)
    } else {
      setProduct(null)
    }

    setFetching(true)
    void getProductBySlugOrId(slug).then((p) => {
      if (cancelled) return
      setProduct(p)
      setFetching(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug, catalogProducts])

  useEffect(() => {
    if (!product?.id) return
    try {
      const raw = localStorage.getItem('pdp_recent_ids')
      const ids: string[] = raw ? JSON.parse(raw) : []
      const next = [product.id, ...ids.filter((id) => id !== product.id)].slice(0, 24)
      localStorage.setItem('pdp_recent_ids', JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [product?.id])

  useEffect(() => {
    const el = heroSentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [product?.id])

  const similarProducts = useMemo(() => {
    if (!product) return []
    const bucket = storefrontCategorySlugForProduct(product)
    if (!bucket) {
      return catalogProducts.filter((p) => p.id !== product.id).slice(0, 8)
    }
    return catalogProducts
      .filter((p) => p.id !== product.id && productBelongsToCategoryPage(p, bucket))
      .slice(0, 8)
  }, [catalogProducts, product])

  const discountPct = useMemo(() => {
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0
    return calculateDiscount(product.originalPrice, product.price)
  }, [product])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    void addToCart(product, quantity)
  }, [addToCart, product, quantity])

  const handleBuyNow = useCallback(async () => {
    if (!product || product.stock <= 0) return
    await addToCart(product, quantity)
    router.push('/checkout/')
  }, [addToCart, product, quantity, router])

  const handleWishlistToggle = useCallback(() => {
    if (!product) return
    if (isInWishlist(product.id)) removeFromWishlist(product.id)
    else addToWishlist(product)
  }, [product, addToWishlist, removeFromWishlist, isInWishlist])

  const handleShare = useCallback(async () => {
    if (!product) return
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.name, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      /* ignore */
    }
  }, [product])

  if (catalogLoading && !product && !fetching) {
    return (
      <div className="container-custom py-16 text-center text-ds-text-secondary">
        Loading product…
      </div>
    )
  }

  if (!product && !fetching) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="mb-4 text-ds-text-secondary">Product not found.</p>
        <Link href="/" className="font-medium text-ds-accent hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center text-ds-text-secondary">
        Loading product…
      </div>
    )
  }

  const categoryBucket = storefrontCategorySlugForProduct(product)
  const categoryMeta = categoryBucket
    ? staticCategories.find((c) => c.slug === categoryBucket)
    : null
  const categoryHref = categoryBucket ? `/category/${categoryBucket}/` : '/categories/'
  const categoryLabel = categoryMeta?.name ?? product.category
  const inWishlist = isInWishlist(product.id)
  const similarIds = similarProducts.map((p) => p.id)

  return (
    <div className={cn('bg-ds-primary pb-8', stickyVisible && 'pb-28')}>
      <div ref={heroSentinelRef} id="pdp-hero" className="container-custom pt-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ds-text-secondary">
          <Link href="/" className="transition duration-180 ease-out hover:text-ds-accent">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href={categoryHref} className="transition duration-180 ease-out hover:text-ds-accent">
            {categoryLabel}
          </Link>
          <span aria-hidden>/</span>
          <span className="max-w-[200px] truncate text-ds-text-primary sm:max-w-none">{product.name}</span>
        </nav>

        <div className="rounded-2xl border border-ds-border bg-ds-surface p-4 sm:p-6 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery
              product={product}
              selectedIndex={selectedImage}
              onSelect={setSelectedImage}
              discountPercent={discountPct}
            />
            <ProductInfo
              product={product}
              categoryLabel={categoryLabel}
              categoryHref={categoryHref}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onWishlistToggle={handleWishlistToggle}
              inWishlist={inWishlist}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>

      <PDPTrustRow />

      <ProductDescription product={product} />
      <ProductSpecs product={product} categoryDisplayName={categoryLabel} />
      <ProductShipping />
      <ProductReviewsMock rating={product.rating} reviewsCount={product.reviewsCount} />
      <SimilarProducts products={similarProducts} />
      <RecommendedProducts
        product={product}
        catalog={catalogProducts}
        excludeIds={similarIds}
      />

      <PdpSectionCta />

      <PdpStickyBar
        product={product}
        visible={stickyVisible}
        quantity={quantity}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}

function PdpSectionCta() {
  return (
    <section className="border-b border-ds-border bg-ds-primary py-12 md:py-16">
      <div className="container-custom flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
        <Link
          href="/categories/"
          className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-ds-accent bg-transparent px-8 py-3 text-center text-sm font-semibold uppercase tracking-wide text-ds-accent transition duration-180 ease-out hover:bg-ds-surface sm:max-w-xs"
        >
          Continue Shopping
        </Link>
        <Link
          href="/product/"
          className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-ds-accent bg-transparent px-8 py-3 text-center text-sm font-semibold uppercase tracking-wide text-ds-accent transition duration-180 ease-out hover:bg-ds-surface sm:max-w-xs"
        >
          View All Products
        </Link>
      </div>
    </section>
  )
}
