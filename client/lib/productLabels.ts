import type { Product } from '@/lib/types'

export type ProductRibbon = 'best-seller' | 'new' | 'top-rated'

const LOW_STOCK_MAX = 15

export function getProductRibbons(product: Product): ProductRibbon[] {
  const set = new Set<ProductRibbon>()
  if (product.isNewLaunch) set.add('new')
  if (product.featured && product.reviewsCount >= 150) set.add('best-seller')
  if (product.rating >= 4.8 && product.reviewsCount >= 50) set.add('top-rated')
  const order: ProductRibbon[] = ['new', 'best-seller', 'top-rated']
  return order.filter((x) => set.has(x))
}

export function ribbonLabel(r: ProductRibbon): string {
  switch (r) {
    case 'best-seller':
      return 'Best Seller'
    case 'new':
      return 'New'
    case 'top-rated':
      return 'Top Rated'
    default:
      return ''
  }
}

export function specChips(product: Product, max = 3): string[] {
  const entries = Object.entries(product.specs ?? {})
  const chips: string[] = []
  for (let i = 0; i < entries.length && chips.length < max; i++) {
    const v = entries[i][1]
    if (!v?.trim()) continue
    const t = v.trim()
    chips.push(t.length > 28 ? `${t.slice(0, 25)}…` : t)
  }
  return chips
}

export function stockLabel(stock: number): { text: string; tone: 'in' | 'low' | 'out' } {
  if (stock <= 0) return { text: 'Out of Stock', tone: 'out' }
  if (stock <= LOW_STOCK_MAX) return { text: 'Low Stock', tone: 'low' }
  return { text: 'In Stock', tone: 'in' }
}

export function hasFreeShipping(product: Product): boolean {
  return product.price >= 999
}
