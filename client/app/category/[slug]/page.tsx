import { categories } from '@/lib/data/categories'
import CategoryPageClient from './CategoryPageClient'

export function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }))
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CategoryPageClient slug={slug} />
}
