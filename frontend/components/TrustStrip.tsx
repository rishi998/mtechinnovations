'use client'

import { Truck, ShieldCheck, Headphones, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const items = [
  { icon: ShieldCheck, title: 'Genuine Components', subtitle: 'Verified sourcing' },
  { icon: Truck, title: 'Fast Delivery', subtitle: 'Pan-India logistics network' },
  { icon: RotateCcw, title: 'Easy Returns', subtitle: 'Hassle-free policy' },
  { icon: Headphones, title: 'Secure Payments', subtitle: 'Trusted checkout flow' },
]

export function TrustStrip() {
  const { ref, visible } = useScrollReveal()

  return (
    <section ref={ref} className="border-b border-ds-border bg-ds-surface py-8 md:py-10 lg:py-12">
      <div className="container-custom">
        <div
          className={clsx(
            'grid grid-cols-1 gap-5 transition-[opacity,transform] duration-600 ease-out sm:grid-cols-2 md:grid-cols-4',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
          )}
        >
          {items.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex min-w-0 flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ds-border bg-ds-primary">
                <Icon className="h-6 w-6 text-ds-accent" strokeWidth={1.75} />
              </div>
              <h3 className="mt-3 break-safe text-sm font-semibold text-ds-text-primary md:text-base">
                {title}
              </h3>
              <p className="mt-1 break-safe text-xs leading-relaxed text-ds-text-secondary md:text-sm">
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
