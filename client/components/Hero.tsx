'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useId, useState } from 'react'
import type { Product } from '@/lib/types'

type HeroProps = {
  heroProduct: Product
}

export function Hero({ heroProduct }: HeroProps) {
  const img = heroProduct.images[0]
  const alt = heroProduct.name

  return (
    <section className="border-b border-ds-border bg-ds-primary">
      <div className="container-custom py-12 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 max-w-xl lg:order-1">
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
                <RippleCta href="/categories">Shop the collection</RippleCta>
              </div>
            </div>
          </div>

          <div className="order-1 flex justify-center motion-safe:animate-hero-enter-delayed lg:order-2 lg:justify-end motion-reduce:translate-y-0 motion-reduce:opacity-100">
            <div className="relative w-full max-w-lg">
              <div className="relative overflow-hidden rounded-2xl border border-ds-border bg-ds-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-ds-primary">
                  <Image
                    src={img}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 480px"
                    priority
                  />
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
      className="relative inline-flex overflow-hidden rounded-lg bg-ds-accent px-8 py-4 text-sm font-semibold uppercase tracking-wide text-ds-text-primary transition duration-180 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-3 w-3 rounded-full bg-ds-light motion-safe:animate-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </Link>
  )
}
