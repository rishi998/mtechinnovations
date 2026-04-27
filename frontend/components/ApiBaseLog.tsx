'use client'

import { useEffect } from 'react'
import { getPublicApiUrl } from '@/lib/env/publicApi'

/** One-time log of the configured public API base (no secrets). */
export function ApiBaseLog() {
  useEffect(() => {
    const base = getPublicApiUrl()
    console.info('[ClientEcomm] Public API base:', base)
  }, [])
  return null
}
