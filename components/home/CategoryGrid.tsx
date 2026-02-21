'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { categories } from '@/lib/data/categories'

export function CategoryGrid() {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-lg">
            Explore our wide range of electronics and components
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/category/${category.slug}`}
                className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
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
