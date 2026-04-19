import CategoryPageClient from './CategoryPageClient'
import {
  fetchProductsListForBuild,
  deriveCategoriesFromProducts,
} from '@/lib/api/catalog'
import { categories as staticCategories } from '@/lib/data/categories'

/**
 * With `output: export`, every visited slug must be listed here. Nav links use
 * `lib/data/categories` slugs (e.g. `arduino`); API-derived names may differ or
 * be empty during dev, so we always union both sources.
 */
export async function generateStaticParams() {
  const products = await fetchProductsListForBuild()
  const derived = deriveCategoriesFromProducts(products)
  const slugs = new Set<string>()
  for (const c of staticCategories) {
    slugs.add(c.slug)
  }
  for (const c of derived) {
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
