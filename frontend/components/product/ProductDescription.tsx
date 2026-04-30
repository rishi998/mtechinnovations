'use client'

import type { Product } from '@/lib/types'
import { extractFeatureBullets } from '@/lib/pdpUtils'
import { PdpSection } from '@/components/product/PdpSection'

type ProductDescriptionProps = {
  product: Product
}

function htmlToPlainParagraphs(html: string): string[] {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
}

export function ProductDescription({ product }: ProductDescriptionProps) {
  const raw = product.description?.trim()
  const looksHtml = !!raw && /<[a-z][\s\S]*>/i.test(raw)
  const paragraphs = raw
    ? looksHtml
      ? htmlToPlainParagraphs(raw)
      : raw.split(/\n\n+/).map((para) => para.trim()).filter(Boolean)
    : []
  const bodyJoined = paragraphs.join('\n\n')
  const bulletList = [...new Set(extractFeatureBullets(product))]

  if (!bodyJoined && bulletList.length === 0) return null

  return (
    <PdpSection className="border-b border-ds-border bg-ds-primary py-12 md:py-16">
      <div className="container-custom max-w-4xl">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Product Description</h2>
        {bodyJoined && (
          <div className="mt-6 space-y-4 text-base leading-[1.75] text-ds-text-secondary">
            {paragraphs.map((para, i) => (
              <p key={i} className="break-safe">
                {para}
              </p>
            ))}
          </div>
        )}
        {bulletList.length > 0 && (
          <ul className="mt-8 space-y-3 border-t border-ds-border pt-8">
            {bulletList.map((line) => (
              <li key={line} className="flex gap-3 text-ds-text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ds-accent" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PdpSection>
  )
}
