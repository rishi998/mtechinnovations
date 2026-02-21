export interface Product {
  id: string
  name: string
  slug: string
  category: string
  subcategory: string
  price: number
  originalPrice?: number
  discount?: number
  images: string[]
  rating: number
  reviewsCount: number
  stock: number
  description: string
  specs: Record<string, string>
  tags: string[]
  brand: string
  featured?: boolean
  trending?: boolean
  dealOfDay?: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  productCount: number
  subcategories: string[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface WishlistItem {
  product: Product
  addedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  addresses: Address[]
  orders: Order[]
}

export interface Address {
  id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export interface Order {
  id: string
  orderId: string
  date: Date
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  shippingAddress: Address
  paymentMethod: string
  trackingId?: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: Date
  helpful: number
}

export interface FilterOptions {
  priceRange: [number, number]
  brands: string[]
  categories: string[]
  rating?: number
  inStock?: boolean
  discount?: number
}

export interface SortOption {
  label: string
  value: string
}
