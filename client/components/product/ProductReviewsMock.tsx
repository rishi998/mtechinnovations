'use client'

import { Star } from 'lucide-react'
import { PdpSection } from '@/components/product/PdpSection'
import { cn } from '@/lib/utils'

const MOCK = [
  { name: 'Verified Buyer', rating: 5, text: 'Packed well and matched the listing. Works as expected on my project.', date: 'Mar 2026' },
  { name: 'Hobbyist', rating: 4, text: 'Good value. Delivery was quick to Bangalore.', date: 'Feb 2026' },
  { name: 'Lab order', rating: 5, text: 'Repeat purchase — consistent quality across batches.', date: 'Jan 2026' },
]

type ProductReviewsMockProps = {
  rating: number
  reviewsCount: number
}

export function ProductReviewsMock({ rating, reviewsCount }: ProductReviewsMockProps) {
  return (
    <PdpSection className="border-b border-ds-border bg-ds-primary py-12 md:py-16">
      <div className="container-custom max-w-4xl">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Customer Reviews</h2>
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-ds-border bg-ds-surface px-6 py-5">
          <span className="text-4xl font-bold text-ds-text-primary">{rating.toFixed(1)}</span>
          <div>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-5 w-5',
                    i < Math.floor(rating) ? 'fill-ds-accent text-ds-accent' : 'text-ds-text-secondary/35',
                  )}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-ds-text-secondary">Based on {reviewsCount} reviews</p>
          </div>
        </div>
        <ul className="mt-8 space-y-6">
          {MOCK.map((r) => (
            <li
              key={r.name + r.date}
              className="rounded-xl border border-ds-border bg-ds-surface p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ds-text-primary">{r.name}</span>
                <span className="text-xs text-ds-text-secondary">{r.date}</span>
              </div>
              <div className="mt-2 flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < r.rating ? 'fill-ds-accent text-ds-accent' : 'text-ds-text-secondary/35',
                    )}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ds-text-secondary">{r.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-ds-text-secondary">
          Sample reviews for demonstration. Aggregate rating reflects catalog data.
        </p>
      </div>
    </PdpSection>
  )
}
