import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { SectionWrapper } from '@/components/layout/SectionWrapper'
import { getAllSlugs, getPostBySlug } from '@/lib/data/blog'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) {
    notFound()
  }

  return (
    <>
      <SectionWrapper surface="surface">
        <article className="container-custom max-w-3xl py-12 md:py-16">
          <Link
            href="/blog/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ds-link transition-colors hover:underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to blog
          </Link>

          <header className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight text-ds-text-primary md:text-[2rem] md:leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ds-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" strokeWidth={1.75} />
                {post.date}
              </span>
              <span className="rounded-full bg-ds-muted px-3 py-1 text-xs font-medium text-ds-text-primary">
                Maurya Enterprises
              </span>
            </div>
          </header>

          <div className="relative mt-10 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-ds-border bg-ds-muted md:aspect-[2/1]">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              placeholder="blur"
              blurDataURL={PRODUCT_IMAGE_BLUR}
              priority
            />
          </div>

          <div className="mt-10 space-y-4 text-base leading-relaxed text-ds-text-secondary">
            <p className="text-lg text-ds-text-primary">{post.excerpt}</p>
            <p>
              This is a placeholder article body. Replace this copy with your CMS content or markdown — wire your
              preferred headless source into this route when you are ready to publish long-form guides at scale.
            </p>
            <p>
              For BOM checks, shipping cut-offs, and compatibility questions, contact our team using the details in
              the footer — we support builders, universities, and competition teams across India.
            </p>
          </div>
        </article>
      </SectionWrapper>
    </>
  )
}
