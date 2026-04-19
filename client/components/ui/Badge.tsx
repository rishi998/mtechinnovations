import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'border border-ds-border bg-ds-muted text-ds-text-secondary',
    success: 'border border-ds-accent/25 bg-ds-soft text-ds-accent',
    warning: 'border border-ds-border bg-ds-surface text-ds-text-primary',
    danger: 'border border-red-200 bg-red-50 text-red-700',
    info: 'border border-ds-border bg-ds-surface text-ds-text-secondary',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
