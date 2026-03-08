'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function PageBackButton() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/') return null

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="container-custom py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-gray-600 hover:text-gray-900 -ml-1"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  )
}
