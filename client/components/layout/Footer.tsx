import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Truck, Shield, Award, Quote } from 'lucide-react'
import { categories } from '@/lib/data/categories'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Trust strip (Robu/Robocraze style) */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-primary-400" />
              <span className="font-semibold text-white">Free Shipping</span>
              <span className="text-sm">On orders over ₹999</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-primary-400" />
              <span className="font-semibold text-white">Best Price Guarantee</span>
              <span className="text-sm">Lowest prices assured</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-8 h-8 text-primary-400" />
              <span className="font-semibold text-white">300,000+ Orders</span>
              <span className="text-sm">Trusted by makers</span>
            </div>
            <div className="flex flex-col items-center gap-2 col-span-2 lg:col-span-1">
              <span className="text-2xl font-bold text-white">Pan-India</span>
              <span className="text-sm">Delivery to all states</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo.png"
                alt="MTech Innovations"
                width={120}
                height={38}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <h4 className="text-sm text-gray-400">MTech Innovations is a brand owned by Maurya Enterprises</h4>
            <p className="text-sm mb-4 mt-2">
              Your one-stop shop for all electronics, Arduino, Raspberry Pi, sensors,
              motors, and robotics components.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-primary-400 transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-primary-400 transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>123 Electronics Street, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+911234567890" className="hover:text-primary-400">
                  +91 123 456 7890
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:info@electrostore.com" className="hover:text-primary-400">
                  info@electrostore.com
                </a>
              </li>
            </ul>
          </div>

          {/* Customer testimonials placeholder */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Quote className="w-4 h-4 text-primary-400" />
              What customers say
            </h4>
            <blockquote className="text-sm italic text-gray-400 border-l-2 border-primary-500 pl-4">
              &ldquo;Great components, fast delivery. Best place for Arduino and sensors.&rdquo;
            </blockquote>
            <p className="text-xs text-gray-500 mt-2">— Verified buyer</p>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-semibold mb-1">Subscribe to our Newsletter</h4>
              <p className="text-sm">Get the latest updates on new products and offers</p>
            </div>
            <form className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64 text-base"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {currentYear} ElectroStore. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary-400 transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
