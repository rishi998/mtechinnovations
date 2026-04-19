import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-ds-border bg-ds-card p-4 text-ds-text-primary shadow-[var(--shadow-card-elevated)]',
          hover && 'cursor-pointer transition-shadow hover:shadow-[var(--shadow-card-elevated-hover)]',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'
