'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

/**
 * IntersectionObserver-driven reveal: opacity 0→1, translateY 20px→0.
 */
export function useScrollReveal(options: Options = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const { root = null, rootMargin = '0px 0px -8% 0px', threshold = 0.12, once = true } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e) return
        if (e.isIntersecting) {
          setVisible(true)
          if (once) obs.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { root, rootMargin, threshold },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [root, rootMargin, threshold, once])

  return { ref, visible }
}
