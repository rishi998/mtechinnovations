export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-ds-border bg-ds-surface">
      <div className="aspect-square w-full bg-ds-primary">
        <div className="h-full w-full animate-pulse bg-ds-surface" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-ds-border" />
        <div className="h-3 w-full animate-pulse rounded bg-ds-border" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-ds-border" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-ds-border" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-ds-border" />
      </div>
    </div>
  )
}
