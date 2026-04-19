import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type SectionSurface = 'primary' | 'surface' | 'ink'

type SectionWrapperProps = {
  children: React.ReactNode
  surface?: SectionSurface
  className?: string
  id?: string
}

export const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(function SectionWrapper(
  { children, surface = 'primary', className, id },
  ref,
) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'border-b border-ds-border',
        surface === 'primary' && 'bg-ds-primary',
        surface === 'surface' && 'bg-ds-surface',
        surface === 'ink' && 'bg-ds-ink',
        className,
      )}
    >
      {children}
    </section>
  )
})
