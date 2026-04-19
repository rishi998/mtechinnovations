'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { brands } from '@/lib/data/brands'
import { categories } from '@/lib/data/categories'

interface FilterSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onFilterChange: (filters: any) => void
  currentFilters: any
}

export function FilterSidebar({
  isOpen = true,
  onClose,
  onFilterChange,
  currentFilters,
}: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState(currentFilters.priceRange || [0, 10000])
  const [selectedBrands, setSelectedBrands] = useState<string[]>(currentFilters.brands || [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters.categories || []
  )
  const [minRating, setMinRating] = useState(currentFilters.rating || 0)
  const [inStockOnly, setInStockOnly] = useState(currentFilters.inStock || false)

  const handleBrandToggle = (brand: string) => {
    const updated = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand]
    setSelectedBrands(updated)
    onFilterChange({ ...currentFilters, brands: updated })
  }

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(updated)
    onFilterChange({ ...currentFilters, categories: updated })
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    const updated: [number, number] = [0, value]
    setPriceRange(updated)
    onFilterChange({ ...currentFilters, priceRange: updated })
  }

  const handleRatingChange = (rating: number) => {
    setMinRating(rating)
    onFilterChange({ ...currentFilters, rating })
  }

  const handleStockToggle = () => {
    setInStockOnly(!inStockOnly)
    onFilterChange({ ...currentFilters, inStock: !inStockOnly })
  }

  const handleClearFilters = () => {
    setPriceRange([0, 10000])
    setSelectedBrands([])
    setSelectedCategories([])
    setMinRating(0)
    setInStockOnly(false)
    onFilterChange({
      priceRange: [0, 10000],
      brands: [],
      categories: [],
      rating: 0,
      inStock: false,
    })
  }

  return (
    <div className={`border border-ds-border bg-ds-surface rounded-xl shadow-sm p-6 ${!isOpen && 'hidden'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-ds-text-primary">Filters</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearFilters}
            className="text-sm text-ds-accent hover:brightness-110"
          >
            Clear All
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6 pb-6 border-b">
        <h4 className="font-medium text-ds-text-primary mb-3">Price Range</h4>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={priceRange[1]}
            onChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-ds-text-secondary">
            <span>₹0</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6 pb-6 border-b">
        <h4 className="font-medium text-ds-text-primary mb-3">Categories</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.slice(0, 8).map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.name)}
                onChange={() => handleCategoryToggle(category.name)}
                className="w-4 h-4 text-ds-accent rounded focus:ring-ds-accent"
              />
              <span className="text-sm text-ds-text-secondary">{category.name}</span>
              <span className="text-xs text-ds-text-secondary ml-auto">
                ({category.productCount})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6 pb-6 border-b">
        <h4 className="font-medium text-ds-text-primary mb-3">Brands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.name)}
                onChange={() => handleBrandToggle(brand.name)}
                className="w-4 h-4 text-ds-accent rounded focus:ring-ds-accent"
              />
              <span className="text-sm text-ds-text-secondary">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6 pb-6 border-b">
        <h4 className="font-medium text-ds-text-primary mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="w-4 h-4 text-ds-accent focus:ring-ds-accent"
              />
              <span className="text-sm text-ds-text-secondary">{rating}★ & above</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="font-medium text-ds-text-primary mb-3">Availability</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={handleStockToggle}
            className="w-4 h-4 text-ds-accent rounded focus:ring-ds-accent"
          />
          <span className="text-sm text-ds-text-secondary">In Stock Only</span>
        </label>
      </div>
    </div>
  )
}
