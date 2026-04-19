import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { CartProvider } from '@/lib/context/CartContext'
import { CatalogProvider } from '@/lib/context/CatalogContext'
import { WishlistProvider } from '@/lib/context/WishlistContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'mtech',
    template: '%s | mtech',
  },
  description:
    'M Tech Innovations — shop Arduino, Raspberry Pi, sensors, motors, and electronics components. Fast shipping and trusted support.',
  keywords: 'mtech, M Tech Innovations, electronics, arduino, raspberry pi, sensors, motors, robotics',
  icons: {
    icon: [{ url: '/images/logo.png', type: 'image/png', sizes: 'any' }],
    apple: [{ url: '/images/logo.png', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
          `}
        </Script>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <WishlistProvider>
                <AppShell>{children}</AppShell>
              </WishlistProvider>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
