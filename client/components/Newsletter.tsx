'use client'

import { useState, FormEvent } from 'react'
import { clsx } from 'clsx'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function Newsletter() {
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
    <section ref={ref} className="border-b border-ds-border bg-ds-primary py-16 md:py-20">
      <div
        className={clsx(
          'container-custom mx-auto max-w-xl text-center transition-[opacity,transform] duration-600 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        )}
      >
        <h2 className="text-section font-semibold text-ds-text-primary">Stay in the loop</h2>
        <p className="mt-3 text-base leading-[1.7] text-ds-text-secondary">
          New arrivals, restocks, and project ideas—no spam, unsubscribe anytime.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-center">
          <label htmlFor="newsletter-email" className="sr-only">
            Email
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-ds-border bg-ds-surface px-4 py-3 text-base text-ds-text-primary placeholder:text-ds-text-secondary outline-none transition focus:border-ds-accent sm:max-w-md"
          />
          <button
            type="submit"
            className="min-h-12 shrink-0 rounded-lg bg-ds-accent px-8 py-3 text-sm font-semibold uppercase tracking-wide text-ds-inverse transition duration-180 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
          >
            Subscribe
          </button>
        </form>
        {submitted && (
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ds-text-primary" role="status">
            Thanks — you are on the list.
          </p>
        )}
      </div>
    </section>
  )
}
