'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'

export function Hero() {
  return (
    <section className="border-b border-ds-border bg-ds-primary">
      <div className="container-custom py-10 md:py-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <h1 className="max-w-xl break-safe text-3xl font-bold leading-tight text-ds-text-primary sm:text-4xl md:text-5xl lg:text-6xl">
              Precision electronics for makers & engineers
            </h1>
            <p className="mt-5 max-w-xl break-safe text-base leading-relaxed text-ds-text-secondary md:text-lg">
              Build faster with trusted boards, sensors, motors and modules from a curated catalog.
              Clear specs, real stock visibility, and quick dispatch for your next project.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/product/" className="btn-primary inline-flex min-h-10 items-center justify-center gap-2">
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/categories/" className="btn-secondary inline-flex min-h-10 items-center justify-center">
                Explore Categories
              </Link>
            </div>
            <div className="mt-6 flex flex-col gap-2 text-sm font-medium text-ds-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-6">
              <span>✔ Genuine Components</span>
              <span>✔ Fast Delivery</span>
              <span>✔ Secure Payments</span>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-ds-border bg-ds-surface shadow-[var(--shadow-hero-panel)]">
              <Image
                src="https://images.unsplash.com/photo-1553406830-ef2513450d76?w=1400&q=80"
                alt="Electronics components and development boards"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                placeholder="blur"
                blurDataURL={PRODUCT_IMAGE_BLUR}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ds-overlay/80 to-transparent px-5 pb-5 pt-20">
                <p className="break-safe text-sm font-semibold uppercase tracking-wide text-ds-inverse">
                  Trusted by students, makers and engineers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
