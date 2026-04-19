'use client'

import { ShieldCheck, Headphones, Award } from 'lucide-react'
import { PdpSection } from '@/components/product/PdpSection'

const items = [
  {
    icon: ShieldCheck,
    title: 'Authentic parts',
    subtitle: 'Sourced and verified for genuine electronics.',
  },
  {
    icon: Award,
    title: 'Manufacturer warranty',
    subtitle: 'Coverage as stated by the brand where applicable.',
  },
  {
    icon: Headphones,
    title: 'Expert support',
    subtitle: 'Help with compatibility, returns, and orders.',
  },
]

export function PDPTrustRow() {
  return (
    <PdpSection className="border-b border-ds-border bg-ds-surface py-12 md:py-14">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, subtitle }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ds-border bg-ds-primary">
                <Icon className="h-6 w-6 text-ds-text-secondary" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ds-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ds-text-secondary">{subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </PdpSection>
  )
}
