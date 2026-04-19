import type { Product } from '@/lib/types'

export const PDP_TAX_LABEL = 'GST 18%'
export const PDP_UNIT_LABEL = 'pcs'

/** Lines that look like feature bullets (•, -, *) */
export function extractFeatureBullets(product: Product): string[] {
  const out: string[] = []
  const desc = product.description?.trim()
  if (desc) {
    for (const line of desc.split(/\r?\n/)) {
      const t = line.trim()
      if (/^[•\-\*]\s*/.test(t)) {
        out.push(t.replace(/^[•\-\*]\s*/, '').trim())
      }
    }
  }
  for (const tag of product.tags ?? []) {
    const t = tag.trim()
    if (t && !out.includes(t)) out.push(t)
  }
  return out.slice(0, 12)
}

/** Short lead for hero (first paragraph or first ~220 chars). */
export function shortDescription(product: Product): string {
  const d = product.description?.trim()
  if (!d) return ''
  const firstPara = d.split(/\n\n+/)[0]?.trim() ?? d
  if (firstPara.length <= 280) return firstPara
  return `${firstPara.slice(0, 277)}…`
}

export type SpecRow = { label: string; value: string }

export function buildSpecsTableRows(
  product: Product,
  categoryDisplayName: string,
): SpecRow[] {
  const seen = new Set<string>()
  const rows: SpecRow[] = []

  const push = (label: string, value: string) => {
    const k = label.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    rows.push({ label, value: value || '—' })
  }

  push('SKU', product.sku ?? '—')
  push('Category', categoryDisplayName)

  const specs = product.specs ?? {}
  const preferredOrder = ['HSN Code', 'HSN', 'Voltage', 'Current', 'Unit', 'Tax']
  for (const key of preferredOrder) {
    const v = specs[key]
    if (v != null && String(v).trim() !== '') push(key, String(v))
  }
  for (const [key, value] of Object.entries(specs)) {
    if (preferredOrder.includes(key)) continue
    const kl = key.toLowerCase()
    if (kl === 'category') continue
    if (kl === 'sku') continue
    if (kl === 'hsn' && seen.has('hsn code')) continue
    push(key, String(value))
  }

  if (!seen.has('unit')) push('Unit', PDP_UNIT_LABEL)
  if (!seen.has('tax')) push('Tax', PDP_TAX_LABEL)

  return rows
}
