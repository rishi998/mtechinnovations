'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Cpu,
  Monitor,
  Radio,
  Cog,
  Battery,
  TabletSmartphone,
  Wrench,
  Boxes,
  Bot,
} from 'lucide-react'
import { categories as staticCategories } from '@/lib/data/categories'
import { clsx } from 'clsx'

const iconFor = (slug: string) => {
  const m: Record<string, typeof Cpu> = {
    arduino: Cpu,
    'raspberry-pi': Monitor,
    sensors: Radio,
    'motors-drivers': Cog,
    'power-supply': Battery,
    displays: TabletSmartphone,
    batteries: Battery,
    tools: Wrench,
    components: Boxes,
    robotics: Bot,
  }
  return m[slug] ?? Boxes
}

export function CategoryStrip() {
  return (
    <section className="border-b border-ds-border bg-ds-surface py-8 md:py-10">
      <div className="container-custom">
        <h2 className="text-section font-semibold text-ds-text-primary">Shop by category</h2>
        <p className="mt-2 max-w-2xl text-base leading-[1.7] text-ds-text-secondary">
          Browse popular families—boards, sensing, motion, and power.
        </p>
      </div>
      <div className="mt-8 pl-4 sm:pl-6 lg:pl-8">
        <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2 pr-4 sm:pr-6 lg:pr-8">
          {staticCategories.map((c) => {
            const Icon = iconFor(c.slug)
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}/`}
                className={clsx(
                  'group flex min-w-[160px] shrink-0 flex-col gap-4 rounded-xl border border-ds-border bg-ds-primary p-4 transition duration-250 ease-out',
                  'hover:scale-[1.02] hover:border-ds-accent hover:shadow-[var(--shadow-elevated-md)]',
                )}
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-ds-border bg-ds-surface">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    className="object-cover transition duration-250"
                    sizes="56px"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0 text-ds-text-secondary" strokeWidth={1.75} />
                  <span className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary">
                    {c.name}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
