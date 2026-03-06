import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
