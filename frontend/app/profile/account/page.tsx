'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  MapPin,
  Package,
} from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent('/profile/account'))
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-ds-accent hover:brightness-110 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to profile
        </Link>

        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 mb-6 text-ds-inverse">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border border-ds-border bg-ds-surface/20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{user.name}</h1>
              <p className="text-ds-text-primary text-sm sm:text-base truncate">{user.email}</p>
            </div>
            <Link href="/profile/edit" className="flex-shrink-0">
              <Button
                variant="secondary"
                className="border border-ds-border bg-ds-surface text-ds-accent hover:bg-ds-surface border-0 w-full sm:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-ds-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-ds-accent" />
            Account details
          </h2>
          <dl className="space-y-4">
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-ds-text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-ds-text-secondary uppercase tracking-wide">
                  Email
                </dt>
                <dd className="text-ds-text-primary">{user.email}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-ds-text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-ds-text-secondary uppercase tracking-wide">
                  Phone
                </dt>
                <dd className="text-ds-text-primary">{user.phone || '—'}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-ds-text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-ds-text-secondary uppercase tracking-wide">
                  Saved addresses
                </dt>
                <dd className="text-ds-text-primary">{user.addresses?.length ?? 0}</dd>
              </div>
            </div>
          </dl>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Link href="/profile/edit" className="flex-1 min-w-[140px]">
            <Button className="w-full">
              <Pencil className="w-4 h-4 mr-2" />
              Edit profile
            </Button>
          </Link>
          <Link href="/orders" className="flex-1 min-w-[140px]">
            <Button variant="outline" className="w-full">
              <Package className="w-4 h-4 mr-2" />
              Order history
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1 min-w-[140px]"
            onClick={() => {
              logout()
              router.refresh()
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  )
}
