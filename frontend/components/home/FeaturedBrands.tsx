'use client'

import { motion } from 'framer-motion'
import { brands } from '@/lib/data/brands'

export function FeaturedBrands() {
  return (
    <section className="py-10 sm:py-16 bg-ds-primary">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ds-text-primary mb-3">
            Shop by Brand
          </h2>
          <p className="text-ds-text-secondary text-base sm:text-lg">
            We partner with the best brands in electronics
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-ds-border bg-ds-surface rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-8 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-ds-surface rounded-full mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-ds-text-secondary">
                    {brand.name.charAt(0)}
                  </span>
                </div>
                <p className="font-medium text-ds-text-primary text-sm sm:text-base">{brand.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
