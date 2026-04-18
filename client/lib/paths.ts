/** Product detail URL that works with `output: 'export'` (no per-slug static HTML). */
export function productPath(slug: string, id?: string): string {
  const ref = (slug?.trim() || id?.trim() || '').trim()
  if (!ref) return '/'
  return `/product/?slug=${encodeURIComponent(ref)}`
}

/** Razorpay payment step; works with `output: 'export'` (no `/checkout/[orderId]` HTML per id). */
export function checkoutPayPath(orderId: string): string {
  return `/checkout/pay/?orderId=${encodeURIComponent(orderId)}`
}
