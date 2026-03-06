import { HeroBanner } from '@/components/home/HeroBanner'
import { HeroProductGrid } from '@/components/home/HeroProductGrid'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { NewLaunchSection } from '@/components/home/NewLaunchSection'
import { TrendingProducts } from '@/components/home/TrendingProducts'
import { DealsOfDay } from '@/components/home/DealsOfDay'
import { FeaturedBrands } from '@/components/home/FeaturedBrands'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <section className="container-custom py-4 sm:py-8">
        <HeroBanner />
      </section>

      {/* Bestsellers / Featured product grid (hero-style) */}
      <HeroProductGrid />

      {/* Featured Categories */}
      <CategoryGrid />

      {/* New Launch / Latest Products */}
      <NewLaunchSection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Deals of the Day */}
      <DealsOfDay />

      {/* Trending Products */}
      <TrendingProducts />

      {/* Featured Brands */}
      <FeaturedBrands />
    </div>
  )
}
