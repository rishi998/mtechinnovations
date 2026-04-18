import { notFound } from 'next/navigation'
import CategoryPageClient from './CategoryPageClient'
import {
  fetchProductsListForBuild,
  deriveCategoriesFromProducts,
} from '@/lib/api/catalog'

const BUILD_SLUG = '__build_placeholder__'

export async function generateStaticParams() {
  const products = await fetchProductsListForBuild()
  const cats = deriveCategoriesFromProducts(products)
  if (cats.length) {
    return cats.map((c) => ({ slug: c.slug }))
  }
  return [{ slug: BUILD_SLUG }]
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (slug === BUILD_SLUG) {
    notFound()
  }
  return <CategoryPageClient slug={slug} />
}
