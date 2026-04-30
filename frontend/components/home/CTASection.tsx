'use client'

import { useState, FormEvent } from 'react'
import { clsx } from 'clsx'
import { SectionWrapper } from '@/components/layout/SectionWrapper'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function CTASection() {
  const { ref, visible } = useScrollReveal()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    setEmail('')
    window.setTimeout(() => setSubmitted(false), 3200)
  }

  return (
    <SectionWrapper ref={ref} surface="ink" className="border-t border-ds-inverse/10 py-10 md:py-12 lg:py-16">
      <div
        className={clsx(
          'container-custom mx-auto max-w-2xl text-center transition-[opacity,transform] duration-600 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        )}
      >
        <h2 className="text-section font-semibold tracking-tight text-ds-inverse">
          Need help choosing a board?
        </h2>
        <p className="mt-4 break-safe text-base leading-[1.75] text-ds-ink-muted">
          Get guides, tips, and restock alerts—no spam, unsubscribe anytime.
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-center"
        >
          <label htmlFor="cta-email" className="sr-only">
            Email
          </label>
          <input
            id="cta-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-ds-border bg-ds-surface px-4 py-3 text-base text-ds-text-primary placeholder:text-ds-text-secondary outline-none transition duration-250 focus:border-ds-accent sm:max-w-md"
          />
          <button
            type="submit"
            className="min-h-12 shrink-0 rounded-lg bg-ds-accent px-8 py-3 text-sm font-semibold uppercase tracking-wide text-ds-inverse transition duration-250 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
          >
            Get updates
          </button>
        </form>
        {submitted && (
          <p className="mt-4 break-safe text-sm font-semibold uppercase tracking-wide text-ds-inverse" role="status">
            Thanks — you are on the list.
          </p>
        )}
      </div>
    </SectionWrapper>
  )
}
