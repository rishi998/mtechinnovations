import { HeroBanner } from '@/components/home/HeroBanner'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { TrendingProducts } from '@/components/home/TrendingProducts'
import { DealsOfDay } from '@/components/home/DealsOfDay'
import { FeaturedBrands } from '@/components/home/FeaturedBrands'

export default function HomePage() {
  return (
    <div>
      {/* Hero Banner */}
      <section className="container-custom py-8">
        <HeroBanner />
      </section>

      {/* Featured Categories */}
      <CategoryGrid />

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
