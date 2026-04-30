'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import { clsx } from 'clsx'
import { SectionWrapper } from '@/components/layout/SectionWrapper'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'

const articles = [
  {
    tag: 'Tutorial',
    title: 'Getting started with Arduino Uno',
    description: 'Wire your first circuit, load a sketch, and verify serial output without guesswork.',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&q=80',
    read: '6 min read',
    author: 'DevBoard Hub',
    date: 'April 10, 2024',
  },
  {
    tag: 'Project',
    title: 'Raspberry Pi headless setup',
    description: 'Enable SSH, configure Wi‑Fi, and secure your Pi before you attach peripherals.',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80',
    read: '8 min read',
    author: 'DevBoard Hub',
    date: 'March 22, 2024',
  },
  {
    tag: 'Guide',
    title: 'Choosing the right motor driver',
    description: 'Match voltage, current, and control interface to your chassis before you buy.',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80',
    read: '5 min read',
    author: 'DevBoard Hub',
    date: 'February 14, 2024',
  },
] as const

const cardClass = clsx(
  'group flex h-full flex-col overflow-hidden rounded-xl border border-ds-border bg-ds-card',
  'transition duration-250 ease-out hover:scale-[1.02] hover:shadow-[var(--shadow-elevated-md)]',
)

export function LearningSection() {
  const { ref, visible } = useScrollReveal()

  return (
    <SectionWrapper ref={ref} surface="primary" className="py-10 md:py-12 lg:py-16">
      <div className="container-custom">
        <div
          className={clsx(
            'flex flex-col gap-6 md:flex-row md:items-end md:justify-between transition-[opacity,transform] duration-600 ease-out',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
          )}
        >
          <div className="max-w-2xl">
            <h2 className="text-section font-semibold tracking-tight text-ds-text-primary">
              Learning & Resources
            </h2>
            <p className="mt-4 break-safe text-base leading-[1.75] text-ds-text-secondary">
              Practical guides for building reliable circuits, shipping firmware, and sourcing parts that match
              your BOM.
            </p>
          </div>
          <Link
            href="/faq/"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-ds-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ds-inverse transition duration-250 ease-out hover:scale-[1.02] hover:brightness-110"
          >
            View all articles
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {articles.map((article) => (
            <article key={article.title} className={cardClass}>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-ds-muted">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  className="object-cover transition duration-250 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  placeholder="blur"
                  blurDataURL={PRODUCT_IMAGE_BLUR}
                />
                <span className="absolute left-3 top-3 rounded-full border border-rose-200/90 bg-ds-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ds-soft-foreground">
                  {article.tag}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-6">
                <h3 className="line-clamp-2 break-safe text-lg font-semibold leading-snug text-ds-link transition duration-180 hover:underline">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 break-safe text-sm leading-relaxed text-ds-text-secondary">
                  {article.description}
                </p>
                <div className="mt-4 border-t border-ds-border pt-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ds-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {article.read}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span className="truncate">{article.author}</span>
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-ds-text-secondary/90">{article.date}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
