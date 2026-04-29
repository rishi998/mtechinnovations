import Link from 'next/link'
import { Headphones, Package, Truck } from 'lucide-react'
import { BlogCard } from '@/components/blog/BlogCard'
import { BlogSectionHeader } from '@/components/blog/BlogSectionHeader'
import { SectionWrapper } from '@/components/layout/SectionWrapper'
import { blogArticles, blogTutorials } from '@/lib/data/blog'

export default function BlogPage() {
  return (
    <>
      <SectionWrapper surface="surface" className="border-b border-ds-border">
        <div className="container-custom py-12 md:py-16">
          <nav className="mb-6 text-sm text-ds-text-secondary">
            <Link href="/" className="transition-colors hover:text-ds-link">
              Home
            </Link>
            <span className="mx-2 text-ds-border">/</span>
            <span className="text-ds-text-primary">Blog</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-ds-text-primary md:text-4xl">
            Blogs & tutorials
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ds-text-secondary md:text-lg">
            Guides, builds, and announcements from Maurya Enterprises — same spirit as leading electronics
            marketplaces: practical tutorials, sharp photography, and wiring tips you can trust.
          </p>
        </div>
      </SectionWrapper>

      {/* Light value strip — inspired by “same day shipping” row */}
      <SectionWrapper surface="primary" className="border-b border-ds-border">
        <div className="container-custom py-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {[
              {
                icon: Truck,
                title: 'Pan-India dispatch',
                body: 'Orders packed quickly from our fulfilment partners.',
              },
              {
                icon: Headphones,
                title: 'Dedicated support',
                body: 'Reach us on phone & email for BOM and order questions.',
              },
              {
                icon: Package,
                title: 'Curated catalog',
                body: 'Boards, sensors, motors & power — aligned to maker projects.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-ds-border/80 bg-ds-secondary/80 px-6 py-6 shadow-sm"
              >
                <Icon className="h-9 w-9 text-ds-text-primary" strokeWidth={1.5} />
                <h3 className="mt-4 text-lg font-semibold text-ds-text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ds-text-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper surface="surface" id="articles" className="scroll-mt-24">
        <div className="container-custom py-14 md:py-16">
          <BlogSectionHeader title="Articles" viewAllHref="#tutorials" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {blogArticles.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper surface="primary" id="tutorials" className="scroll-mt-24">
        <div className="container-custom py-14 md:py-16">
          <BlogSectionHeader title="Tutorials" viewAllHref="#articles" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {blogTutorials.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper surface="surface">
        <div className="container-custom py-12 text-center">
          <p className="text-sm text-ds-text-secondary">
            Looking for products?{' '}
            <Link href="/categories/" className="font-semibold text-ds-link underline-offset-4 hover:underline">
              Browse categories
            </Link>
          </p>
        </div>
      </SectionWrapper>
    </>
  )
}
