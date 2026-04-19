'use client'

import { useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export type SortOption = 'default' | 'price-asc' | 'price-desc'

type CategoryOption = { value: string; label: string }

type ProductFiltersProps = {
  sort: SortOption
  onSortChange: (v: SortOption) => void
  category: string
  onCategoryChange: (v: string) => void
  categories: CategoryOption[]
  priceMin: string
  priceMax: string
  onPriceMinChange: (v: string) => void
  onPriceMaxChange: (v: string) => void
  onOpenMobileDrawer: () => void
  className?: string
}

export function ProductFilters({
  sort,
  onSortChange,
  category,
  onCategoryChange,
  categories,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onOpenMobileDrawer,
  className,
}: ProductFiltersProps) {
  return (
    <>
      <div
        className={cn(
          'hidden flex-col gap-4 rounded-xl border border-ds-border bg-ds-primary/80 p-4 md:flex md:flex-row md:flex-wrap md:items-end md:justify-between',
          className,
        )}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Select
            label="Sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            options={[
              { value: 'default', label: 'Featured order' },
              { value: 'price-asc', label: 'Price: Low → High' },
              { value: 'price-desc', label: 'Price: High → Low' },
            ]}
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={categories}
          />
          <Input
            label="Min price (₹)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
          />
          <Input
            label="Max price (₹)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex md:hidden">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ds-border bg-ds-surface px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ds-text-primary transition duration-180 ease-out hover:border-ds-accent"
        >
          <SlidersHorizontal className="h-4 w-4 text-ds-text-secondary" strokeWidth={1.75} />
          Sort &amp; filters
        </button>
      </div>
    </>
  )
}

type MobileFiltersDrawerProps = {
  open: boolean
  onClose: () => void
} & Omit<ProductFiltersProps, 'onOpenMobileDrawer' | 'className'>

export function MobileFiltersDrawer({
  open,
  onClose,
  sort,
  onSortChange,
  category,
  onCategoryChange,
  categories,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
}: MobileFiltersDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250"
        onClick={onClose}
        aria-label="Close filters"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] motion-safe:animate-slide-up rounded-t-2xl border border-ds-border border-b-0 bg-ds-surface p-5 shadow-[0_-16px_48px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ds-border" />
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-ds-text-secondary">
          Sort &amp; filter
        </p>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          <Select
            label="Sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            options={[
              { value: 'default', label: 'Featured order' },
              { value: 'price-asc', label: 'Price: Low → High' },
              { value: 'price-desc', label: 'Price: High → Low' },
            ]}
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={categories}
          />
          <Input
            label="Min price (₹)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
          />
          <Input
            label="Max price (₹)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-6 w-full"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
