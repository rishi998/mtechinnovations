'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navGhostSm =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 px-3 py-1.5 text-sm gap-2 -ml-1'

export function PageBackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="container-custom flex flex-wrap items-center gap-2 py-3">
        {isHome ? (
          <span
            className={cn(navGhostSm, 'text-primary-600 cursor-default')}
            aria-current="page"
          >
            <Home className="w-4 h-4 shrink-0" />
            Home
          </span>
        ) : (
          <Link
            href="/"
            className={cn(
              navGhostSm,
              'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            )}
            aria-label="Go to home"
          >
            <Home className="w-4 h-4 shrink-0" />
            Home
          </Link>
        )}
        {!isHome && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 text-gray-600 hover:text-gray-900"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back
          </Button>
        )}
      </div>
    </div>
  )
}
