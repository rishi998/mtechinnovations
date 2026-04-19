import { Hero } from '@/components/Hero'
import { CategoryStrip } from '@/components/CategoryStrip'
import { ProductGrid } from '@/components/ProductGrid'
import { PromoBanner } from '@/components/PromoBanner'
import { TrustStrip } from '@/components/TrustStrip'
import { Newsletter } from '@/components/Newsletter'

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryStrip />
      <ProductGrid />
      <PromoBanner />
      <TrustStrip />
      <Newsletter />
    </>
  )
}
