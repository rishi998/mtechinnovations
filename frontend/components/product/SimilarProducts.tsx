'use client'

import { ProductCard } from '@/components/product/ProductCard'
import { PdpSection } from '@/components/product/PdpSection'
import type { Product } from '@/lib/types'

type SimilarProductsProps = {
  products: Product[]
}

export function SimilarProducts({ products }: SimilarProductsProps) {
  if (products.length === 0) return null

  return (
    <PdpSection className="border-b border-ds-border bg-ds-primary py-12 md:py-16">
      <div className="container-custom">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Similar Products</h2>
        <p className="mt-2 text-sm text-ds-text-secondary">More items from the same category.</p>
        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 hide-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="w-[min(280px,85vw)] shrink-0 sm:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </PdpSection>
  )
}
