'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    /* ignore */
  }
  return getSystemTheme()
}

/** Updates DOM + React state only (no localStorage) — for system preference follow. */
function setDomTheme(next: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', next)
}

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    setMounted(true)
    const t =
      (typeof document !== 'undefined' &&
        (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null)) ||
      null
    setTheme(t === 'dark' || t === 'light' ? t : readStoredTheme())
  }, [])

  const persistTheme = useCallback((next: 'light' | 'dark') => {
    setDomTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setTheme(next)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return
      } catch {
        /* ignore */
      }
      const next = mq.matches ? 'dark' : 'light'
      setDomTheme(next)
      setTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mounted])

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null
    const resolved = current === 'dark' || current === 'light' ? current : readStoredTheme()
    const next = resolved === 'dark' ? 'light' : 'dark'
    setRotation((r) => r + 180)
    persistTheme(next)
  }, [persistTheme])

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl text-xl',
        'text-ds-text-primary transition-transform duration-200 ease-out hover:bg-ds-primary hover:scale-[1.02]',
        'md:h-12 md:w-12',
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block select-none leading-none transition-transform duration-200 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
