import { products } from '@/lib/data/products'
import ProductPageClient from './ProductPageClient'

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ProductPageClient slug={slug} />
}
