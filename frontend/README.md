# ElectroStore - Modern E-Commerce Electronics Store

A complete, production-ready e-commerce website for electronics built with Next.js 14+, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

### Core Functionality
- ✅ **60 Electronics Products** - Arduino, Raspberry Pi, Sensors, Motors, and more
- ✅ **Homepage** - Hero carousel, featured categories, trending products, deals of the day
- ✅ **Product Listing** - Advanced filters (price, brand, rating, stock), sorting, grid/list view
- ✅ **Product Details** - Image gallery, specs, related products, add to cart/wishlist
- ✅ **Shopping Cart** - Quantity management, coupon codes, order summary
- ✅ **Checkout** - Multi-step checkout (address, payment, review), order confirmation
- ✅ **User Authentication** - Login, Register with form validation
- ✅ **User Dashboard** - Profile, orders history, wishlist, saved addresses
- ✅ **Search** - Real-time product search with autocomplete
- ✅ **Wishlist** - Save favorite products
- ✅ **Additional Pages** - About, Contact, FAQ, 404

### Technical Features
- ⚡ **Next.js 14+ App Router** - Latest features and optimizations
- 🎨 **Tailwind CSS** - Modern, responsive design
- 🎭 **Framer Motion** - Smooth animations and transitions
- 📝 **React Hook Form + Zod** - Form handling and validation
- 🎯 **TypeScript** - Type-safe code
- 💾 **LocalStorage** - Cart, wishlist, and auth persistence
- 🎨 **Headless UI** - Accessible UI components
- 📱 **Fully Responsive** - Mobile-first design
- 🔍 **SEO Optimized** - Proper metadata and structure

## 📦 Tech Stack

- **Framework:** Next.js 15.1.0
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **UI Components:** Headless UI
- **State Management:** React Context API

## 🛠️ Installation & Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

3. **Open Browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ClientEcomm/
├── app/                      # Next.js App Router
│   ├── (pages)/             # Route groups
│   │   ├── about/           # About page
│   │   ├── cart/            # Shopping cart
│   │   ├── category/[slug]/ # Category pages
│   │   ├── checkout/        # Checkout flow
│   │   ├── contact/         # Contact page
│   │   ├── faq/             # FAQ page
│   │   ├── login/           # Login page
│   │   ├── orders/          # Order history
│   │   ├── product/[slug]/  # Product details
│   │   ├── profile/         # User profile
│   │   ├── register/        # Registration
│   │   ├── search/          # Search page
│   │   └── wishlist/        # Wishlist page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── loading.tsx          # Loading UI
│   ├── not-found.tsx        # 404 page
│   └── page.tsx             # Homepage
├── components/
│   ├── home/                # Homepage components
│   │   ├── CategoryGrid.tsx
│   │   ├── DealsOfDay.tsx
│   │   ├── FeaturedBrands.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── HeroBanner.tsx
│   │   └── TrendingProducts.tsx
│   ├── layout/              # Layout components
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── shop/                # Shop components
│   │   ├── FilterSidebar.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductCardSkeleton.tsx
│   └── ui/                  # UI components
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       ├── Skeleton.tsx
│       └── Textarea.tsx
├── lib/
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── WishlistContext.tsx
│   ├── data/                # Dummy data
│   │   ├── brands.ts
│   │   ├── categories.ts
│   │   └── products.ts
│   ├── types.ts             # TypeScript types
│   └── utils.ts             # Utility functions
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🎨 Features Showcase

### Homepage
- Animated hero banner carousel with smooth transitions
- Category grid with hover effects
- Featured products section
- Deals of the day with countdown timer
- Trending products
- Featured brands section

### Product Pages
- Advanced filtering (price range, brands, categories, rating, stock)
- Multiple sort options (popularity, price, rating, newest)
- Grid and list view toggle
- Product cards with wishlist and quick add to cart
- Breadcrumb navigation

### Product Details
- Image gallery with thumbnail navigation
- Detailed specifications
- Related products
- Add to cart with quantity selector
- Wishlist functionality
- Tab navigation (Description, Specs, Shipping)

### Shopping Experience
- Persistent cart across sessions
- Real-time cart updates
- Coupon code system
- Order summary with tax and shipping
- Multi-step checkout process
- Order confirmation page

### User Features
- Full authentication system (dummy)
- User profile dashboard
- Order history with tracking
- Wishlist management
- Address management
- Saved preferences

## 🔐 Demo Credentials

```
Email: demo@example.com
Password: demo123
```

Or create a new account - it will be stored in localStorage.

## 🎯 Key Highlights

1. **Modern Stack** - Built with the latest Next.js 14+ features
2. **Production Ready** - Clean code, proper structure, TypeScript
3. **Smooth Animations** - Framer Motion for delightful UX
4. **Fully Functional** - Complete e-commerce flow with dummy data
5. **Responsive Design** - Works perfectly on all devices
6. **SEO Optimized** - Proper metadata and semantic HTML
7. **Performance** - Optimized images, lazy loading, code splitting

## 📱 Pages Included

- Homepage (/)
- Category Listing (/category/[slug])
- Product Details (/product/[slug])
- Search (/search)
- Shopping Cart (/cart)
- Checkout (/checkout)
- Order Success (/order-success)
- Login (/login)
- Register (/register)
- User Profile (/profile)
- Orders (/orders)
- Wishlist (/wishlist)
- About (/about)
- Contact (/contact)
- FAQ (/faq)
- 404 Page

## 🚀 Build for Production

```bash
npm run build
npm start
```

## 📝 Notes

- All product data is dummy data stored in `/lib/data/`
- Authentication uses localStorage (dummy implementation)
- Cart and wishlist persist across sessions
- Coupon codes: Use "SAVE10" for 10% discount
- Free shipping on orders above ₹500

## 🤝 Contributing

This is a demo project. Feel free to use it as a template for your own e-commerce store!

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
