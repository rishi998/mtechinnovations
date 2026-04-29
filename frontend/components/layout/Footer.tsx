import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-ds-ink text-ds-ink-muted">
      <div className="container-custom py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand & contact */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/images/logo.png"
                alt="MTech Innovations"
                width={120}
                height={38}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mb-4 text-sm leading-relaxed text-ds-inverse">
              Powering India&apos;s AI and semiconductor industries through innovative electronic products and
              advancing the &lsquo;Make in India&rsquo; initiative.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-accent" />
                <span>
                  E-131A, Gali No. 4, Mittal Chowk,
                  <br />
                  Pul Pehladpur, New Delhi 110044
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 flex-shrink-0 text-ds-accent" />
                <a href="tel:+917042861418" className="hover:text-ds-accent transition-colors">
                  +91 7042861418
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 flex-shrink-0 text-ds-accent" />
                <a
                  href="mailto:mtech.mauryaenterprises@gmail.com"
                  className="break-all hover:text-ds-accent transition-colors"
                >
                  mtech.mauryaenterprises@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-semibold text-ds-inverse">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-ds-accent">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-ds-accent">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-ds-accent">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-ds-accent">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-ds-accent">
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 font-semibold text-ds-inverse">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/categories" className="transition-colors hover:text-ds-accent">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-ds-accent">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-ds-accent">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-ds-accent">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-ds-accent">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & newsletter */}
          <div>
            <h4 className="mb-4 font-semibold text-ds-inverse">Community</h4>
            <ul className="mb-6 space-y-2.5 text-sm">
              <li>
                <Link href="/contact" className="transition-colors hover:text-ds-accent">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-ds-accent">
                  Partnerships
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-ds-accent">
                  B2B Solutions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-ds-accent">
                  Press
                </Link>
              </li>
            </ul>

            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ds-inverse">Follow Us</p>
            <div className="mb-8 flex flex-wrap gap-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ds-footer-icon text-ds-inverse transition-colors hover:bg-ds-accent"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ds-footer-icon text-ds-inverse transition-colors hover:bg-ds-accent"
                aria-label="X"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ds-footer-icon text-ds-inverse transition-colors hover:bg-ds-accent"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ds-footer-icon text-ds-inverse transition-colors hover:bg-ds-accent"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>

            <h4 className="mb-2 font-semibold text-ds-inverse">Get Updates</h4>
            <p className="mb-3 text-sm">Subscribe to our newsletter for latest updates and announcements</p>
            <form className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                name="email"
                placeholder="Your email"
                autoComplete="email"
                className="w-full rounded-lg border border-ds-footer-input-border bg-ds-footer-icon px-4 py-3 text-base text-ds-inverse placeholder:text-ds-ink-muted focus:outline-none focus:ring-2 focus:ring-ds-accent sm:min-w-0 sm:flex-1"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg bg-ds-accent px-5 py-3 font-medium text-ds-inverse hover:brightness-110 transition-[filter]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ds-inverse/10">
        <div className="container-custom py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 text-sm">
              <p className="text-ds-inverse">
                © {currentYear} Maurya Enterprises. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/privacy" className="transition-colors hover:text-ds-accent">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="transition-colors hover:text-ds-accent">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="transition-colors hover:text-ds-accent">
                  Cookie Policy
                </Link>
              </div>
            </div>
            <p className="max-w-md text-sm text-ds-ink-muted lg:text-right">
              Making India&apos;s Future in Electronics &amp; Semiconductors
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-t border-ds-accent/25 bg-ds-ink">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4 md:gap-4">
            <div>
              <p className="text-xl font-bold text-ds-accent md:text-2xl">100+</p>
              <p className="mt-1 text-xs text-ds-ink-muted md:text-sm">Product Variants</p>
            </div>
            <div>
              <p className="text-xl font-bold text-ds-accent md:text-2xl">Global</p>
              <p className="mt-1 text-xs text-ds-ink-muted md:text-sm">Reach</p>
            </div>
            <div>
              <p className="text-xl font-bold text-ds-accent md:text-2xl">24/7</p>
              <p className="mt-1 text-xs text-ds-ink-muted md:text-sm">Support Available</p>
            </div>
            <div>
              <p className="text-xl font-bold text-ds-accent md:text-2xl">India</p>
              <p className="mt-1 text-xs text-ds-ink-muted md:text-sm">Made with Pride</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
