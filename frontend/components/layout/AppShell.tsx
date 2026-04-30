'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PageBackButton } from '@/components/layout/PageBackButton'
import { CartAddedToast } from '@/components/product/CartAddedToast'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <PageBackButton />
      <main className="min-h-screen overflow-x-hidden bg-ds-primary text-ds-text-primary transition-colors duration-200 ease-out">
        {children}
      </main>
      <Footer />
      <CartAddedToast />
    </>
  )
}
