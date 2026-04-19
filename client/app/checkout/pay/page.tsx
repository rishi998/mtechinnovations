'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckoutPayClient } from '../CheckoutPayClient'

function PayByQuery() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')?.trim() ?? ''

  if (!orderId) {
    return (
      <div className="min-h-screen bg-ds-primary flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-ds-text-secondary">No order selected.</p>
        <Link href="/checkout" className="text-ds-accent font-medium hover:underline">
          Back to checkout
        </Link>
      </div>
    )
  }

  return <CheckoutPayClient orderId={orderId} />
}

function PayFallback() {
  return (
    <div className="min-h-screen bg-ds-primary flex flex-col items-center justify-center gap-3 px-4">
      <div className="h-10 w-10 border-4 border-ds-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-ds-text-secondary">Loading checkout…</p>
    </div>
  )
}

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={<PayFallback />}>
      <PayByQuery />
    </Suspense>
  )
}
