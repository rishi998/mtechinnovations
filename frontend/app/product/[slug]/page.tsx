import { notFound } from 'next/navigation'
import ProductPageClient from './ProductPageClient'
import { fetchProductsListForBuild } from '@/lib/api/catalog'

const BUILD_SLUG = '__build_placeholder__'

export async function generateStaticParams() {
  const products = await fetchProductsListForBuild()
  const slugs = [...new Set(products.map((p) => p.slug).filter(Boolean))]
  if (slugs.length) {
    return slugs.map((slug) => ({ slug }))
  }
  return [{ slug: BUILD_SLUG }]
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (slug === BUILD_SLUG) {
    notFound()
  }
  return <ProductPageClient slug={slug} />
}
