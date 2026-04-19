'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navGhostSm =
  'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ds-accent focus:ring-offset-2 focus:ring-offset-ds-primary gap-2 -ml-1'

export function PageBackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/' || pathname === ''

  if (isHome) {
    return null
  }

  return (
    <div className="border-b border-ds-border bg-ds-primary">
      <div className="container-custom flex flex-wrap items-center gap-2 py-3">
        <Link
          href="/"
          className={cn(
            navGhostSm,
            'text-ds-text-secondary hover:bg-ds-surface hover:text-ds-text-primary',
          )}
          aria-label="Go to home"
        >
          <Home className="h-4 w-4 shrink-0" />
          Home
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-ds-text-secondary hover:text-ds-text-primary"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back
        </Button>
      </div>
    </div>
  )
}
