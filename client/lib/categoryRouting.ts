import type { Product } from '@/lib/types'
import { slugifyCatalogLabel } from '@/lib/api/catalog'
import { categories as staticCategories } from '@/lib/data/categories'

/**
 * Maps storefront category route slugs (from `lib/data/categories`) to additional
 * slugified Zoho/group labels that should resolve to the same page.
 * Keys = route slug; values = slugifyCatalogLabel outputs to treat as that bucket.
 */
const EXTRA_SLUGS_BY_PAGE: Record<string, string[]> = {
  arduino: ['arduino-boards', 'arduino-kits', 'arduino-shields', 'arduino-accessories'],
  'raspberry-pi': ['raspberry-pi-boards', 'raspberry-pi-accessories', 'pi-hats', 'pi-camera'],
  sensors: ['sensor', 'sensor-modules'],
  'motors-drivers': ['motors', 'motor-drivers', 'dc-motors', 'servo-motors', 'stepper-motors'],
  'power-supply': ['power', 'power-supplies', 'adapters', 'solar-panels'],
  displays: ['display', 'lcd-displays', 'oled-displays', 'led-matrices', 'touch-screens'],
  batteries: ['battery', 'lithium-ion', 'lipo'],
  tools: ['tool', 'soldering-tools', 'multimeters'],
  components: ['component', 'resistors', 'capacitors', 'ics', 'connectors'],
  robotics: ['robot', 'robot-kits', 'chassis'],
}

/**
 * Slug derived from the product's Zoho category / group field.
 */
export function productCategorySlug(product: Pick<Product, 'category'>): string {
  return slugifyCatalogLabel(product.category?.trim() || 'Uncategorized')
}

/**
 * Whether a product should appear on `/category/[slug]/` given Zoho's group labels.
 * - Exact slug match (e.g. "Arduino" → `arduino`)
 * - Sub-groups (e.g. "Arduino Boards" → `arduino-boards` → under `arduino`)
 * - Known alias slugs (e.g. "Motors" → `motors` → Motors & Drivers page)
 */
export function productBelongsToCategoryPage(
  product: Pick<Product, 'category'>,
  pageSlug: string,
): boolean {
  const ps = productCategorySlug(product)
  if (ps === pageSlug) return true

  const extras = EXTRA_SLUGS_BY_PAGE[pageSlug]
  if (extras?.includes(ps)) return true

  // Zoho sub-groups: e.g. "Arduino Boards" → arduino-boards matches parent `arduino`
  if (ps.startsWith(`${pageSlug}-`)) return true

  return false
}

/**
 * First matching static storefront route slug for this product, or `null` if none.
 */
export function storefrontCategorySlugForProduct(
  product: Pick<Product, 'category'>,
): string | null {
  for (const c of staticCategories) {
    if (productBelongsToCategoryPage(product, c.slug)) return c.slug
  }
  return null
}
