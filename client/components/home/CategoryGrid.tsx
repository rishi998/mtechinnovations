'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useCatalog } from '@/lib/context/CatalogContext'

export function CategoryGrid() {
  const { categories, loading } = useCatalog()
  const shown = categories.slice(0, 10)

  if (loading && shown.length === 0) {
    return (
      <section className="py-10 sm:py-16">
        <div className="container-custom text-center text-ds-text-secondary text-sm">
          Loading categories…
        </div>
      </section>
    )
  }

  if (shown.length === 0) return null

  return (
    <section className="py-10 sm:py-16">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ds-text-primary mb-3">
            Shop by Category
          </h2>
          <p className="text-ds-text-secondary text-base sm:text-lg">
            From your live Zoho inventory
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {shown.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/category/${category.slug}`}
                className="group block border border-ds-border bg-ds-surface rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-ds-surface">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="p-2 sm:p-4 text-center">
                  <h3 className="font-semibold text-ds-text-primary mb-1 text-sm sm:text-base line-clamp-2">
                    {category.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-ds-text-secondary">
                    {category.productCount} products
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
