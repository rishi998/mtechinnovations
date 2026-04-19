import { Hero } from '@/components/Hero'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { ProductGrid } from '@/components/ProductGrid'
import { UseCaseSection } from '@/components/home/UseCaseSection'
import { LearningSection } from '@/components/home/LearningSection'
import { PromoBanner } from '@/components/PromoBanner'
import { CTASection } from '@/components/home/CTASection'
import { TrustStrip } from '@/components/TrustStrip'

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductGrid />
      <UseCaseSection />
      <LearningSection />
      <PromoBanner />
      <CTASection />
      <TrustStrip />
    </>
  )
}
