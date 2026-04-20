'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ShoppingCart, Menu, X, Heart, User } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useWishlist } from '@/lib/context/WishlistContext'
import { useAuth } from '@/lib/context/AuthContext'
import { clsx } from 'clsx'
import { CART_ADDED_EVENT } from '@/lib/cartEvents'
import { ThemeToggle } from '@/components/ThemeToggle'

const navLinks = [
  { href: '/category/arduino/', label: 'Arduino' },
  { href: '/category/raspberry-pi/', label: 'Raspberry Pi' },
  { href: '/category/sensors/', label: 'Sensors' },
  { href: '/category/motors-drivers/', label: 'Motors' },
  { href: '/categories/', label: 'Shop All' },
  { href: '/track/', label: 'Track order' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [cartPulse, setCartPulse] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const onCartAdded = () => {
      setCartPulse(true)
      window.setTimeout(() => setCartPulse(false), 450)
    }
    window.addEventListener(CART_ADDED_EVENT, onCartAdded)
    return () => window.removeEventListener(CART_ADDED_EVENT, onCartAdded)
  }, [])

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 border-b border-white/20 bg-[#FF6A00] transition-[box-shadow] duration-200 ease-out',
        scrolled && 'shadow-[var(--shadow-nav)]',
      )}
    >
      <div className="flex w-full items-center gap-x-2 py-1.5 pl-2 pr-4 sm:gap-x-3 sm:pl-3 sm:pr-6 md:gap-x-4 md:py-2 md:pl-4 lg:pr-8">
        <Link
          href="/"
          className="relative z-10 flex min-w-0 shrink-0 items-center gap-2"
          aria-label="Home"
        >
          <Image
            src="/images/logo.png"
            alt="M TECH Innovations"
            width={440}
            height={130}
            className="block h-[4.5rem] w-auto max-h-[4.75rem] object-contain object-left md:h-20 md:max-h-[5.25rem]"
            priority
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-center px-1 md:flex md:flex-nowrap md:items-center md:gap-x-3 lg:gap-x-5 xl:gap-x-7"
          aria-label="Main"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 whitespace-nowrap text-sm font-bold uppercase tracking-wide text-black transition duration-180 ease-out hover:text-black/75 lg:text-base"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0 md:gap-4">
          <Link
            href="/search/"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-black transition duration-180 ease-out hover:bg-black/10 hover:scale-[1.02] md:h-12 md:w-12"
            aria-label="Search"
          >
            <Search className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.75} />
          </Link>

          <ThemeToggle className="text-black hover:bg-black/10" />

          <Link
            href="/wishlist/"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-black transition duration-180 ease-out hover:bg-black/10 hover:scale-[1.02] md:h-12 md:w-12"
            aria-label="Wishlist"
          >
            <Heart className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.75} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full border border-black/20 bg-black px-1 text-[11px] font-semibold text-white">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart/"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-black transition duration-180 ease-out hover:bg-black/10 hover:scale-[1.02] md:h-12 md:w-12"
            aria-label="Cart"
          >
            <ShoppingCart
              className={clsx('h-6 w-6 md:h-7 md:w-7', cartPulse && 'motion-safe:animate-cart-bump')}
              strokeWidth={1.75}
            />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1 text-xs font-semibold uppercase text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <div className="relative hidden sm:block" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              aria-expanded={userOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-black transition duration-180 ease-out hover:bg-black/10 md:h-12 md:w-12"
              aria-label="Account"
            >
              <User className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.75} />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-ds-border bg-ds-surface py-1 shadow-[var(--shadow-elevated-md)]">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-ds-border px-4 py-3">
                      <p className="truncate text-sm font-medium text-ds-text-primary">{user?.name}</p>
                      <p className="truncate text-xs text-ds-text-secondary">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile/"
                      className="block px-4 py-2.5 text-sm text-ds-text-secondary transition hover:bg-ds-primary hover:text-ds-text-primary"
                      onClick={() => setUserOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders/"
                      className="block px-4 py-2.5 text-sm text-ds-text-secondary transition hover:bg-ds-primary hover:text-ds-text-primary"
                      onClick={() => setUserOpen(false)}
                    >
                      Orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setUserOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-ds-primary"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login/"
                      className="block px-4 py-2.5 text-sm text-ds-text-secondary transition hover:bg-ds-primary hover:text-ds-text-primary"
                      onClick={() => setUserOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register/"
                      className="block px-4 py-2.5 text-sm text-ds-text-secondary transition hover:bg-ds-primary hover:text-ds-text-primary"
                      onClick={() => setUserOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-black hover:bg-black/10 md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-7 w-7" strokeWidth={1.75} /> : <Menu className="h-7 w-7" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/20 bg-[#FF6A00] px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-base font-bold uppercase tracking-wide text-black"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/wishlist/"
              className="text-base font-semibold uppercase tracking-wide text-black"
              onClick={() => setMobileOpen(false)}
            >
              Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
            </Link>
            <Link
              href="/profile/"
              className="text-base font-semibold uppercase tracking-wide text-black"
              onClick={() => setMobileOpen(false)}
            >
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
