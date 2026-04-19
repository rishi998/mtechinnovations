export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-primary">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-ds-border border-t-ds-accent" />
      </div>
    </div>
  )
}
