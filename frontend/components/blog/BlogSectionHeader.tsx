import Link from 'next/link'

type Props = {
  title: string
  viewAllHref?: string
}

/** Section row: bold title left, outline “View all” right (Robu-style). */
export function BlogSectionHeader({ title, viewAllHref = '/blog/' }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <h2 className="text-2xl font-bold tracking-tight text-ds-text-primary sm:text-[28px]">{title}</h2>
      <Link
        href={viewAllHref}
        className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg border border-ds-link bg-ds-surface px-5 py-2.5 text-sm font-semibold text-ds-link transition duration-180 hover:bg-ds-secondary"
      >
        View All
      </Link>
    </div>
  )
}
