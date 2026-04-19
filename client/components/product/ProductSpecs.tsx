'use client'

import type { Product } from '@/lib/types'
import { buildSpecsTableRows } from '@/lib/pdpUtils'
import { PdpSection } from '@/components/product/PdpSection'

type ProductSpecsProps = {
  product: Product
  categoryDisplayName: string
}

export function ProductSpecs({ product, categoryDisplayName }: ProductSpecsProps) {
  const rows = buildSpecsTableRows(product, categoryDisplayName)
  if (rows.length === 0) return null

  return (
    <PdpSection className="border-b border-ds-border bg-ds-surface py-12 md:py-16">
      <div className="container-custom max-w-4xl">
        <h2 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">Specifications</h2>
        <div className="mt-6 overflow-hidden rounded-xl border border-ds-border bg-ds-primary">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              {rows.map(({ label, value }) => (
                <tr
                  key={label}
                  className="border-b border-ds-border last:border-b-0 [&:nth-child(even)]:bg-ds-surface/80"
                >
                  <th
                    scope="row"
                    className="w-[40%] px-4 py-3 font-medium text-ds-text-secondary sm:w-1/3"
                  >
                    {label}
                  </th>
                  <td className="px-4 py-3 text-ds-text-primary">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PdpSection>
  )
}
