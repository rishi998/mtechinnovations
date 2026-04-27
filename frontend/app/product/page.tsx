'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductPageClient from './[slug]/ProductPageClient'

function ProductByQuery() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')?.trim() ?? ''

  if (!slug) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="text-ds-text-secondary mb-4">No product selected.</p>
        <Link href="/" className="text-ds-accent font-medium hover:underline">
          Back to home
        </Link>
      </div>
    )
  }
  return <ProductPageClient slug={slug} />
}

export default function ProductQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-16 text-center text-ds-text-secondary">
          Loading product… 
        </div>
      }
    >
      <ProductByQuery />
    </Suspense>
  )
}

