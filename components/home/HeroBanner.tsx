'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/Button'

const slides = [
  {
    id: 1,
    title: 'Arduino & Microcontrollers',
    subtitle: 'Up to 30% OFF',
    description: 'Complete kits and boards for your next project',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=1200',
    link: '/category/arduino',
    color: 'bg-gradient-to-r from-blue-600 to-cyan-500',
  },
  {
    id: 2,
    title: 'Raspberry Pi Collection',
    subtitle: 'Latest Models Available',
    description: 'Pi 4, Pi Zero 2, and accessories in stock',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1200',
    link: '/category/raspberry-pi',
    color: 'bg-gradient-to-r from-purple-600 to-pink-500',
  },
  {
    id: 3,
    title: 'Sensors & Modules',
    subtitle: 'Starting at ₹59',
    description: 'Huge collection of sensors for all applications',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200',
    link: '/category/sensors',
    color: 'bg-gradient-to-r from-orange-600 to-red-500',
  },
]

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="relative h-[500px] lg:h-[600px] overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 ${slides[currentSlide].color}`}
        >
          <div className="container-custom h-full">
            <div className="grid lg:grid-cols-2 gap-8 items-center h-full py-12">
              {/* Content */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white z-10"
              >
                <p className="text-lg font-medium mb-2">
                  {slides[currentSlide].subtitle}
                </p>
                <h2 className="text-4xl lg:text-6xl font-bold mb-4">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-xl mb-8 text-white/90">
                  {slides[currentSlide].description}
                </p>
                <Link href={slides[currentSlide].link}>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                    Shop Now
                  </Button>
                </Link>
              </motion.div>

              {/* Image */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:block relative h-full"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center rounded-xl opacity-20"
                  style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
