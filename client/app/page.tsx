import { Hero } from '@/components/Hero'
import { CategoryStrip } from '@/components/CategoryStrip'
import { ProductGrid } from '@/components/ProductGrid'
import { PromoBanner } from '@/components/PromoBanner'
import { TrustStrip } from '@/components/TrustStrip'
import { Newsletter } from '@/components/Newsletter'
import { products } from '@/lib/data/products'

export default function HomePage() {
  const heroProduct = products.find((p) => p.featured) ?? products[0]

  return (
    <>
      <Hero heroProduct={heroProduct} />
      <CategoryStrip />
      <ProductGrid />
      <PromoBanner />
      <TrustStrip />
      <Newsletter />
    </>
  )
}
