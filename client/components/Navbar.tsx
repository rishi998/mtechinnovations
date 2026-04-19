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

const navLinks = [
  { href: '/category/arduino/', label: 'Arduino' },
  { href: '/category/raspberry-pi/', label: 'Raspberry Pi' },
  { href: '/category/sensors/', label: 'Sensors' },
  { href: '/categories/', label: 'Shop All' },
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
        'sticky top-0 z-50 border-b border-ds-border bg-ds-primary transition-[box-shadow] duration-200 ease-out',
        scrolled && 'shadow-[0_12px_40px_rgba(0,0,0,0.55)]',
      )}
    >
      <div className="container-custom flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="ElectroStore"
            width={120}
            height={38}
            className="h-8 w-auto object-contain brightness-0 invert md:h-9"
            priority
          />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 md:flex md:items-center md:gap-8"
          aria-label="Main"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium uppercase tracking-wide text-ds-text-primary transition duration-180 ease-out hover:brightness-110"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <Link
            href="/search/"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ds-text-primary transition duration-180 ease-out hover:scale-[1.02] hover:brightness-110"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </Link>

          <Link
            href="/wishlist/"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ds-text-primary transition duration-180 ease-out hover:scale-[1.02] hover:brightness-110"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" strokeWidth={1.75} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-ds-border bg-ds-surface px-1 text-[10px] font-semibold text-ds-text-primary">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart/"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ds-text-primary transition duration-180 ease-out hover:scale-[1.02] hover:brightness-110"
            aria-label="Cart"
          >
            <ShoppingCart
              className={clsx('h-5 w-5', cartPulse && 'motion-safe:animate-cart-bump')}
              strokeWidth={1.75}
            />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ds-accent px-1 text-xs font-semibold uppercase text-ds-text-primary">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <div className="relative hidden sm:block" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              aria-expanded={userOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ds-text-primary transition duration-180 ease-out hover:bg-ds-surface"
              aria-label="Account"
            >
              <User className="h-5 w-5" strokeWidth={1.75} />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-ds-border bg-ds-surface py-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
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
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-ds-primary"
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
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ds-text-primary md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-ds-border bg-ds-primary px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/wishlist/"
              className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
            </Link>
            <Link
              href="/profile/"
              className="text-sm font-semibold uppercase tracking-wide text-ds-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Account
            </Link>
            <Link
              href="/track/"
              className="text-sm font-semibold uppercase tracking-wide text-ds-text-secondary"
              onClick={() => setMobileOpen(false)}
            >
              Track order
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
