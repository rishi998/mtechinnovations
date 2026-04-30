import CategoryPageClient from './CategoryPageClient'
import { deriveCategoriesFromProducts } from '@/lib/api/catalog'
import {
  fetchProductsListForBuild,
  fetchZohoCategoriesForBuild,
} from '@/lib/api/fetchProductsForStaticBuild'
import { categories as staticCategories } from '@/lib/data/categories'

/**
 * With `output: export`, every visited slug must be listed here. Union three
 * sources so static export prerenders every slug nav can land on:
 *  - Static storefront routes (`lib/data/categories`)
 *  - Slugs derived from synced products (`/api/products`)
 *  - Live Zoho item-group slugs (`/api/zoho/products/categories`) so empty
 *    or freshly-created Zoho groups aren't 404 on the static site.
 */
export async function generateStaticParams() {
  const [products, zohoCategories] = await Promise.all([
    fetchProductsListForBuild(),
    fetchZohoCategoriesForBuild(),
  ])
  const derived = deriveCategoriesFromProducts(products)
  const slugs = new Set<string>()
  for (const c of staticCategories) {
    slugs.add(c.slug)
  }
  for (const c of derived) {
    slugs.add(c.slug)
  }
  for (const c of zohoCategories) {
    slugs.add(c.slug)
  }
  return [...slugs].sort().map((slug) => ({ slug }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <CategoryPageClient slug={slug} />
}
