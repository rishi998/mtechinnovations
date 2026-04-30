'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, ShoppingCart, Menu, X, Heart, User } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useWishlist } from '@/lib/context/WishlistContext'
import { useAuth } from '@/lib/context/AuthContext'
import { useCatalog } from '@/lib/context/CatalogContext'
import { clsx } from 'clsx'
import { CART_ADDED_EVENT } from '@/lib/cartEvents'
import { ThemeToggle } from '@/components/ThemeToggle'
import { productPath } from '@/lib/paths'
import { firstProductImageUrl } from '@/lib/api/catalog'

const navLinks = [
  { href: '/category/arduino/', label: 'Arduino' },
  { href: '/category/raspberry-pi/', label: 'Raspberry Pi' },
  { href: '/category/sensors/', label: 'Sensors' },
  { href: '/category/motors-drivers/', label: 'Motors' },
  { href: '/categories/', label: 'Shop All' },
  { href: '/track/', label: 'Track order' },
]

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [shopOpen, setShopOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [cartPulse, setCartPulse] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const shopRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { products } = useCatalog()
  const { user, isAuthenticated, logout } = useAuth()
  const navButtonClass =
    'rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[0.8rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:scale-105 hover:bg-white/15 hover:text-white hover:shadow-[0_8px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:scale-110 hover:bg-white/15 hover:text-white hover:shadow-[0_10px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:h-12 md:w-12'
  const searchResults =
    searchQuery.trim().length < 2
      ? []
      : products
          .filter((product) => {
            const q = searchQuery.toLowerCase()
            return (
              product.name.toLowerCase().includes(q) ||
              product.category.toLowerCase().includes(q) ||
              product.brand.toLowerCase().includes(q)
            )
          })
          .slice(0, 12)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen, searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(id)
  }, [searchOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false)
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
        'sticky top-0 z-50 border-b border-white/10 bg-[#0B0F0E]/95 text-[#E5E7EB] backdrop-blur-sm transition-[box-shadow] duration-200 ease-out',
        scrolled && 'shadow-[var(--shadow-nav)]',
      )}
    >
      <div className="container-custom flex h-14 items-center justify-between gap-3 px-1.5 sm:gap-4 sm:px-2 md:h-16 md:px-4">
        <Link
          href="/"
          className="relative z-10 flex min-w-0 shrink-0 items-center justify-start"
          aria-label="Home"
        >
          <span className="rounded-md bg-white/10 px-1.5 py-1 shadow-sm sm:px-2">
            <Image
              src="/images/logo.png"
              alt="M TECH Innovations"
              width={440}
              height={130}
              className="block h-10 w-auto object-contain object-left sm:h-11 md:h-[3.9rem]"
              priority
            />
          </span>
        </Link>

        <nav className="relative hidden flex-1 items-center justify-center gap-8 text-sm font-medium tracking-[0.04em] text-[#D1D5DB] md:flex lg:gap-10">
          <div
            ref={shopRef}
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <button
              type="button"
              onClick={() => setShopOpen((v) => !v)}
              className={clsx(navButtonClass, 'hover:underline hover:underline-offset-4')}
            >
              SHOP
            </button>
            {shopOpen && (
              <div className="absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 rounded-md border border-white/10 bg-[#111827] p-1.5 shadow-lg">
                {navLinks.slice(0, 4).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-md px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
                    onClick={() => setShopOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/categories/"
            className={clsx(navButtonClass, 'hover:underline hover:underline-offset-4')}
          >
            DROPS
          </Link>
          <Link
            href="/product/"
            className={clsx(navButtonClass, 'hover:underline hover:underline-offset-4')}
          >
            NEW
          </Link>
          <Link
            href="/categories/?sort=sale"
            className={clsx(
              navButtonClass,
              'font-semibold text-orange-500 hover:text-orange-400',
              pathname?.includes('sale') && 'underline underline-offset-4',
            )}
          >
            SALE
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 text-gray-400 sm:gap-3 md:gap-5">
          <button
            type="button"
            className={clsx(iconButtonClass, 'md:hidden')}
            aria-label="Search products"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-6 w-6" strokeWidth={2.625} />
          </button>

          <ThemeToggle className={clsx(iconButtonClass, 'hidden sm:flex')} />

          <Link
            href="/wishlist/"
            className={clsx('relative hidden sm:flex', iconButtonClass)}
            aria-label="Wishlist"
          >
            <Heart className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.625} />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ds-accent px-1 text-[10px] font-semibold text-white">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart/"
            className={clsx('relative', iconButtonClass)}
            aria-label="Cart"
          >
            <ShoppingCart
              className={clsx('h-6 w-6 md:h-7 md:w-7', cartPulse && 'motion-safe:animate-cart-bump')}
              strokeWidth={2.625}
            />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ds-accent px-1 text-[10px] font-semibold uppercase text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <div className="relative hidden sm:block" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              aria-expanded={userOpen}
              className={iconButtonClass}
              aria-label="Account"
            >
              <User className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.625} />
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
            className={clsx(iconButtonClass, 'md:hidden')}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-7 w-7" strokeWidth={2.625} /> : <Menu className="h-7 w-7" strokeWidth={2.625} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#111827] px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'rounded-md px-3 py-2 text-base font-medium uppercase tracking-[0.04em] text-gray-200 transition hover:bg-white/10 hover:text-white',
                  pathname === l.href && 'font-semibold text-white underline underline-offset-4',
                )}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/wishlist/"
              className="rounded-md px-3 py-2 text-base font-semibold uppercase tracking-[0.04em] text-gray-200 transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
            </Link>
            <Link
              href="/profile/"
              className="rounded-md px-3 py-2 text-base font-semibold uppercase tracking-[0.04em] text-gray-200 transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Account
            </Link>
          </nav>
        </div>
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/55 px-3 py-4 sm:px-4 sm:py-8"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-ds-border bg-ds-surface shadow-[var(--shadow-elevated-md)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-ds-border p-3 sm:gap-3 sm:p-4">
              <Search className="h-5 w-5 text-ds-text-secondary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, category, brand..."
                className="w-full min-w-0 bg-transparent text-sm text-ds-text-primary outline-none placeholder:text-ds-text-secondary sm:text-base"
              />
              <button
                type="button"
                className="rounded-md p-1 text-ds-text-secondary hover:bg-ds-primary"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-4">
              {searchQuery.trim().length < 2 ? (
                <p className="py-10 text-center text-sm text-ds-text-secondary">
                  Type at least 2 characters to search products.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="py-10 text-center text-sm text-ds-text-secondary">
                  No products found for "{searchQuery}".
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={productPath(product.slug, product.id)}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-lg border border-ds-border p-3 transition hover:bg-ds-primary"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-ds-border bg-ds-muted">
                        <Image
                          src={firstProductImageUrl(product.images)}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="line-clamp-2 break-safe text-sm font-semibold text-ds-text-primary">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-ds-text-secondary">
                          {product.category}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ds-accent">
                          ₹{product.price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
