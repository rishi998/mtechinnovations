'use client'

import { Truck, RotateCcw } from 'lucide-react'
import { PdpSection } from '@/components/product/PdpSection'

export function ProductShipping() {
  return (
    <PdpSection className="border-b border-ds-border bg-ds-primary py-12 md:py-16">
      <div className="container-custom max-w-4xl">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Shipping &amp; Returns</h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-ds-text-primary">
              <Truck className="h-5 w-5 text-ds-accent" strokeWidth={1.75} />
              <h3 className="text-base font-semibold uppercase tracking-wide">Shipping</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ds-text-secondary">
              <li>Standard delivery: 3–7 business days (metro), 5–10 elsewhere.</li>
              <li>Free shipping on orders over ₹999 (after discounts).</li>
              <li>Same-day dispatch for in-stock orders placed before 2 PM IST (where available).</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-ds-text-primary">
              <RotateCcw className="h-5 w-5 text-ds-accent" strokeWidth={1.75} />
              <h3 className="text-base font-semibold uppercase tracking-wide">Returns</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ds-text-secondary">
              <li>7-day return window from delivery for unused items in original packaging.</li>
              <li>Opened consumables and custom-cut items may be non-returnable.</li>
              <li>Refund processed within 5–7 business days after inspection.</li>
            </ul>
          </div>
        </div>
      </div>
    </PdpSection>
  )
}
