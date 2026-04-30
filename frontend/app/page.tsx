import { Hero } from '@/components/Hero'
import { TrustStrip } from '@/components/TrustStrip'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { BestsellersSection } from '@/components/home/BestsellersSection'
import { ProductGrid } from '@/components/ProductGrid'
import { UseCaseSection } from '@/components/home/UseCaseSection'
import { LearningSection } from '@/components/home/LearningSection'
import { PromoBanner } from '@/components/PromoBanner'
import { CTASection } from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <CategoryGrid />
      <BestsellersSection />
      <ProductGrid />
      <UseCaseSection />
      <LearningSection />
      <PromoBanner />
      <CTASection />
    </>
  )
}
