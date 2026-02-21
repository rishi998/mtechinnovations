import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/lib/context/CartContext'
import { WishlistProvider } from '@/lib/context/WishlistContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ElectroStore - Your Electronics & Robotics Partner',
  description: 'Shop Arduino, Raspberry Pi, sensors, motors, and all electronics components. Fast shipping, best prices, quality products.',
  keywords: 'electronics, arduino, raspberry pi, sensors, motors, robotics, components',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
