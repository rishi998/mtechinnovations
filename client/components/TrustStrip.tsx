'use client'

import { Truck, ShieldCheck, Headphones, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const items = [
  { icon: Truck, title: 'Fast delivery', subtitle: 'Pan-India logistics network' },
  { icon: ShieldCheck, title: 'Authentic parts', subtitle: 'Verified sourcing' },
  { icon: Headphones, title: 'Expert support', subtitle: 'Help when you need it' },
  { icon: RotateCcw, title: 'Easy returns', subtitle: 'Hassle-free policy' },
]

export function TrustStrip() {
  const { ref, visible } = useScrollReveal()

  return (
    <section ref={ref} className="border-b border-ds-border bg-ds-surface py-14 md:py-16">
      <div className="container-custom">
        <div
          className={clsx(
            'grid grid-cols-1 gap-10 transition-[opacity,transform] duration-600 ease-out sm:grid-cols-2 lg:grid-cols-4',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
          )}
        >
          {items.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ds-border bg-ds-primary">
                <Icon className="h-6 w-6 text-ds-text-secondary" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ds-text-primary">{title}</h3>
              <p className="mt-2 text-base leading-[1.7] text-ds-text-secondary">{subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
