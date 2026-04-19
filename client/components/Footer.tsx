import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

const shop = [
  { href: '/categories/', label: 'All categories' },
  { href: '/category/arduino/', label: 'Arduino' },
  { href: '/category/sensors/', label: 'Sensors' },
  { href: '/cart/', label: 'Cart' },
]

const support = [
  { href: '/contact/', label: 'Contact' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/shipping-returns/', label: 'Shipping & returns' },
  { href: '/track/', label: 'Track order' },
]

const company = [
  { href: '/about/', label: 'About' },
  { href: '/terms/', label: 'Terms' },
  { href: '/privacy/', label: 'Privacy' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-ds-border bg-ds-primary">
      <div className="container-custom py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="ElectroStore"
                width={120}
                height={38}
                className="h-9 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-base leading-[1.7] text-ds-text-secondary">
              Premium electronics for builders—boards, sensors, motors, and power.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ds-border bg-ds-surface text-ds-text-secondary transition duration-180 ease-out hover:scale-[1.02] hover:border-ds-accent hover:text-ds-text-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ds-border bg-ds-surface text-ds-text-secondary transition duration-180 ease-out hover:scale-[1.02] hover:border-ds-accent hover:text-ds-text-primary"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ds-border bg-ds-surface text-ds-text-secondary transition duration-180 ease-out hover:scale-[1.02] hover:border-ds-accent hover:text-ds-text-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ds-border bg-ds-surface text-ds-text-secondary transition duration-180 ease-out hover:scale-[1.02] hover:border-ds-accent hover:text-ds-text-primary"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary">Shop</h3>
            <ul className="mt-4 space-y-3">
              {shop.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-base leading-[1.7] text-ds-text-secondary transition duration-180 hover:text-ds-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary">Support</h3>
            <ul className="mt-4 space-y-3">
              {support.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-base leading-[1.7] text-ds-text-secondary transition duration-180 hover:text-ds-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary">Company</h3>
            <ul className="mt-4 space-y-3">
              {company.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-base leading-[1.7] text-ds-text-secondary transition duration-180 hover:text-ds-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-ds-border pt-8 text-center text-sm text-ds-text-secondary">
          © {year} ElectroStore. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
