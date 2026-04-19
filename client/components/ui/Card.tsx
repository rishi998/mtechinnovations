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
          'rounded-xl border border-ds-border bg-ds-surface p-4 text-ds-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.25)]',
          hover && 'cursor-pointer transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
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
