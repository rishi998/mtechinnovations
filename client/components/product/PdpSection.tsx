'use client'

import { type ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'

export function PdpSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, visible } = useScrollReveal()
  return (
    <section
      ref={ref as React.LegacyRef<HTMLElement>}
      className={cn(
        'transition duration-600 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        className,
      )}
    >
      {children}
    </section>
  )
}
