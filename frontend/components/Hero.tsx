'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useId, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { categories } from '@/lib/data/categories'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'
import { clsx } from 'clsx'

/** Categories shown in the hero carousel (order = slide order). */
const HERO_SLUGS = [
  'arduino',
  'raspberry-pi',
  'sensors',
  'motors-drivers',
  'power-supply',
  'displays',
] as const

const heroSlides = HERO_SLUGS.map((slug) => {
  const c = categories.find((x) => x.slug === slug)
  if (!c) throw new Error(`Hero carousel: missing category "${slug}"`)
  return { slug: c.slug, name: c.name, image: c.image, href: `/category/${c.slug}/` as const }
})

const AUTO_MS = 6000

export function Hero() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const id = useId()
  const n = heroSlides.length

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n)
    },
    [n],
  )

  useEffect(() => {
    if (paused) return
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n)
    }, AUTO_MS)
    return () => window.clearInterval(t)
  }, [paused, n])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    },
    [go],
  )

  return (
    <section className="border-b border-ds-border bg-ds-primary">
      <div className="container-custom pb-16 pt-10 md:pb-20 md:pt-12 lg:pb-24 lg:pt-14">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 max-w-md lg:order-1 lg:max-w-lg">
            <div className="motion-safe:animate-hero-enter motion-reduce:translate-y-0 motion-reduce:opacity-100">
              <h1 className="text-hero font-extrabold tracking-[-0.5px] text-ds-text-primary">
                Precision electronics.
                <span className="block text-ds-text-primary">Built for makers.</span>
              </h1>
              <p className="mt-6 text-base leading-[1.7] text-ds-text-secondary">
                Shop boards, sensors, motors, and power—curated for reliability, shipped fast,
                and backed by trusted support.
              </p>
              <div className="mt-10">
                <RippleCta href="/categories/">Shop the collection</RippleCta>
              </div>
            </div>
          </div>

          <div className="order-1 flex justify-center motion-safe:animate-hero-enter-delayed lg:order-2 lg:justify-end motion-reduce:translate-y-0 motion-reduce:opacity-100">
            <div className="relative w-full max-w-lg motion-safe:animate-float motion-reduce:animate-none">
              <div
                className="relative overflow-hidden rounded-2xl border border-ds-border bg-ds-surface p-6 shadow-[var(--shadow-hero-panel)] transition duration-300 ease-out hover:shadow-[var(--shadow-hero-panel-hover)]"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
                }}
              >
                <div
                  role="region"
                  aria-roledescription="carousel"
                  aria-label="Featured categories"
                  aria-live="polite"
                  tabIndex={0}
                  onKeyDown={onKeyDown}
                  id={`${id}-carousel`}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-surface"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-ds-muted">
                    <div
                      className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                      style={{ transform: `translateX(-${index * 100}%)` }}
                    >
                      {heroSlides.map((slide, i) => (
                        <Link
                          key={slide.slug}
                          href={slide.href}
                          tabIndex={i === index ? 0 : -1}
                          className="relative h-full min-w-full shrink-0 outline-none transition duration-250 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ds-accent"
                          aria-label={`${slide.name} — open category`}
                        >
                          <Image
                            src={slide.image}
                            alt={slide.name}
                            fill
                            className="object-cover transition duration-250 ease-out hover:brightness-110"
                            sizes="(max-width: 1024px) 100vw, 480px"
                            priority={i === 0}
                            placeholder="blur"
                            blurDataURL={PRODUCT_IMAGE_BLUR}
                          />
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ds-surface/95 to-transparent px-4 pb-4 pt-12">
                            <span className="text-sm font-bold uppercase tracking-wide text-ds-text-primary">
                              {slide.name}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          go(-1)
                        }}
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-ds-border bg-ds-surface/90 text-ds-text-primary shadow-lg backdrop-blur-sm transition duration-180 ease-out hover:border-ds-accent hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-accent"
                        aria-controls={`${id}-carousel`}
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          go(1)
                        }}
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-ds-border bg-ds-surface/90 text-ds-text-primary shadow-lg backdrop-blur-sm transition duration-180 ease-out hover:border-ds-accent hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-accent"
                        aria-controls={`${id}-carousel`}
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-5 w-5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="mt-4 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Choose slide"
                  >
                    {heroSlides.map((slide, i) => (
                      <button
                        key={slide.slug}
                        type="button"
                        aria-current={i === index ? true : undefined}
                        className={clsx(
                          'h-2 rounded-full transition-all duration-250 ease-out',
                          i === index ? 'w-8 bg-ds-accent' : 'w-2 bg-ds-border hover:bg-ds-text-secondary/50',
                        )}
                        onClick={() => setIndex(i)}
                        aria-label={`Show ${slide.name}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type Ripple = { id: string; x: number; y: number }

function RippleCta({ href, children }: { href: string; children: React.ReactNode }) {
  const baseId = useId()
  const [ripples, setRipples] = useState<Ripple[]>([])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const id = `${baseId}-${Date.now()}`
    setRipples((prev) => [...prev, { id, x, y }])
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((p) => p.id !== id))
    }, 650)
  }, [baseId])

  return (
    <Link
      href={href}
      onPointerDown={onPointerDown}
      className="relative inline-flex overflow-hidden rounded-lg bg-ds-accent px-8 py-4 text-sm font-semibold uppercase tracking-wide text-ds-inverse transition duration-180 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-3 w-3 rounded-full bg-ds-inverse/40 motion-safe:animate-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </Link>
  )
}
