import Image from 'next/image'
import Link from 'next/link'
import type { BlogPostMeta } from '@/lib/data/blog'
import { PRODUCT_IMAGE_BLUR } from '@/lib/imagePlaceholder'

type Props = {
  post: BlogPostMeta
}

/** Robu-style card: rounded image on top, bold title below, subtle border. */
export function BlogCard({ post }: Props) {
  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ds-border bg-ds-card shadow-sm transition duration-200 ease-out hover:border-ds-border hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-ds-muted">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition duration-250 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          placeholder="blur"
          blurDataURL={PRODUCT_IMAGE_BLUR}
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-3 text-left text-[15px] font-semibold leading-snug text-ds-text-primary sm:text-base">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs text-ds-text-secondary sm:text-sm">{post.excerpt}</p>
        <time className="mt-auto pt-3 text-xs text-ds-text-secondary/90">{post.date}</time>
      </div>
    </Link>
  )
}
