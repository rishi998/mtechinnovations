'use client'

import { cn } from '@/lib/utils'

export type FeaturedTabId = 'all' | 'bestsellers' | 'new' | 'trending'

const TABS: { id: FeaturedTabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bestsellers', label: 'Best Sellers' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'trending', label: 'Trending' },
]

type ProductTabsProps = {
  value: FeaturedTabId
  onChange: (id: FeaturedTabId) => void
  className?: string
}

export function ProductTabs({ value, onChange, className }: ProductTabsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 border-b border-ds-border pb-4 md:inline-flex md:flex-nowrap md:gap-0 md:rounded-lg md:border md:border-ds-border md:bg-ds-primary md:p-1 md:pb-1',
        className,
      )}
      role="tablist"
      aria-label="Featured picks"
    >
      {TABS.map((t) => {
        const selected = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.id)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition duration-250 ease-out',
              selected
                ? 'bg-ds-surface text-ds-text-primary shadow-sm md:bg-ds-surface'
                : 'text-ds-text-secondary hover:text-ds-text-primary',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
