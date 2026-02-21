'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, ArrowLeft, Lock, Bell, Eye } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordForm = z.infer<typeof passwordSchema>

interface SettingsPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  orderUpdates: boolean
  promotionalEmails: boolean
  productRecommendations: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [preferences, setPreferences] = useState<SettingsPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    promotionalEmails: false,
    productRecommendations: true,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoadingPassword(true)
    setPasswordMessage('')

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      setPasswordMessage('Password changed successfully!')
      reset()
      setTimeout(() => {
        setPasswordMessage('')
      }, 3000)
    } catch (err) {
      setPasswordMessage('Failed to change password. Please try again.')
    } finally {
      setIsLoadingPassword(false)
    }
  }

  const handlePreferenceChange = (key: keyof SettingsPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl">
        {/* Header */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">Manage your account security and preferences</p>
          </div>
        </div>

        {/* Change Password Section */}
        <Card className="mb-8 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          </div>

          {passwordMessage && (
            <div className={`mb-6 p-4 rounded-lg ${passwordMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <Input
                  {...register('currentPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  className={errors.currentPassword ? 'border-red-500 pr-12' : 'pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <Input
                {...register('newPassword')}
                type="password"
                placeholder="Enter your new password"
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              {errors.newPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <Input
                {...register('confirmPassword')}
                type="password"
                placeholder="Confirm your new password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoadingPassword}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Choose how you'd like to receive updates about your orders and our latest offers
          </p>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handlePreferenceChange('emailNotifications')}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-600">Receive updates via SMS</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={() => handlePreferenceChange('smsNotifications')}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">Receive browser push notifications</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={() => handlePreferenceChange('pushNotifications')}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>

            {/* Order Updates */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Order Status Updates</h3>
                <p className="text-sm text-gray-600">Get updates on your order status</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.orderUpdates}
                  onChange={() => handlePreferenceChange('orderUpdates')}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>

            {/* Promotional Emails */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Promotional Emails</h3>
                <p className="text-sm text-gray-600">Receive deals and special offers</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.promotionalEmails}
                  onChange={() => handlePreferenceChange('promotionalEmails')}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>

            {/* Product Recommendations */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Product Recommendations</h3>
                <p className="text-sm text-gray-600">Personalized product suggestions</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.productRecommendations}
                  onChange={() => handlePreferenceChange('productRecommendations')}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button variant="outline">Save Preferences</Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-8 p-8 border-red-200 bg-red-50">
          <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-red-700 text-sm mb-6">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100">
              Delete Account
            </Button>
            <p className="text-xs text-red-600">
              Permanently delete your account and all associated data
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
