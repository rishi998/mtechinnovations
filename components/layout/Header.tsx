'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingCart, Heart, User, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useWishlist } from '@/lib/context/WishlistContext'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '../ui/Button'
import { categories } from '@/lib/data/categories'
import { products } from '@/lib/data/products'
import { debounce } from '@/lib/utils'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle search
  const handleSearch = debounce((query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    
    const filtered = products
      .filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
    
    setSearchResults(filtered)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    handleSearch(value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults([])
      setIsSearchFocused(false)
    }
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white transition-shadow ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      {/* Top Bar */}
      <div className="bg-primary-600 text-white py-2">
        <div className="container-custom">
          <div className="flex items-center justify-between text-sm">
            <p>Free shipping on orders above ₹500</p>
            <div className="flex items-center gap-4">
              <Link href="/track" className="hover:underline">
                Track Order
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary-600">
              MTech Innovations
            </h1>
            <h5 className="text-sm font-bold text-primary-600">Innovating the future</h5>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search for products, brands, or categories..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary-600">
                      ₹{product.price}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <div className="relative group">
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5" />
              </Button>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearchSubmit} className="lg:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Categories Nav */}
      <nav className="border-t border-gray-200">
        <div className="container-custom">
          <div className="hidden lg:flex items-center gap-6 py-3 overflow-x-auto">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 whitespace-nowrap transition-colors"
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/categories"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              View All
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="container-custom py-4">
            <div className="space-y-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
