'use client'

import Image from 'next/image'
import Link from 'next/link'
import { clsx } from 'clsx'
import { SectionWrapper } from '@/components/layout/SectionWrapper'
import { categories as staticCategories } from '@/lib/data/categories'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'

const descriptionFor = (slug: string): string => {
  const m: Record<string, string> = {
    arduino: 'MCU boards, shields, and compatible modules for rapid prototyping.',
    'raspberry-pi': 'Single-board computers, HATs, cameras, and Pi-friendly accessories.',
    sensors: 'Environmental, motion, and interface sensing for accurate measurements.',
    'motors-drivers': 'Motors, drivers, and motion hardware for robotics projects.',
    'power-supply': 'Adapters, regulators, and dependable rails for stable builds.',
    displays: 'LCD, OLED, and touch panels sized for dashboards and handheld UI.',
    batteries: 'Cells, holders, and charging paths that match your current budget.',
    tools: 'Soldering, measurement, and bench tools for repeatable assembly.',
    components: 'Passives, connectors, and silicon for breadboards and small runs.',
    robotics: 'Frames, control, and sensing pieces for automation and mobility.',
  }
  return m[slug] ?? 'Curated parts with clear specs and ready-to-ship inventory.'
}

const cardClass = clsx(
  'group/card flex h-full flex-col overflow-hidden rounded-xl border border-ds-border bg-ds-card',
  'transition duration-250 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[var(--shadow-product-hover)]',
)

export function CategoryGrid() {
  return (
    <SectionWrapper surface="surface" className="py-10 md:py-12 lg:py-16">
      <div className="container-custom">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ds-text-primary md:text-4xl">Shop by Category</h2>
          <p className="mt-4 text-base leading-[1.75] text-ds-text-secondary md:text-lg">
            Find everything you need for boards, sensing, motion, power, and finishing touches.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {staticCategories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}/`} className={cardClass}>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-ds-muted">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  className="object-cover transition duration-300 ease-out group-hover/card:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL={PRODUCT_IMAGE_BLUR}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
                <h3 className="truncate text-base font-semibold text-ds-text-primary md:text-lg">{c.name}</h3>
                <p className="mt-1.5 line-clamp-3 flex-1 break-safe text-sm leading-relaxed text-ds-text-secondary">
                  {descriptionFor(c.slug)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
