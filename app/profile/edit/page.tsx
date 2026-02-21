'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, ArrowLeft, Save } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const editProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number').optional(),
})

type EditProfileForm = z.infer<typeof editProfileSchema>

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

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
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: EditProfileForm) => {
    setIsLoading(true)
    setMessage('')

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      if (updateProfile) {
        updateProfile({
          name: data.name,
          email: data.email,
          phone: data.phone,
        })
      }

      setMessage('Profile updated successfully!')
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (err) {
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-2xl">
        {/* Header */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </Link>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Personal Information</h1>
              <p className="text-gray-600">Update your profile details</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input
                {...register('name')}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                {...register('phone')}
                type="tel"
                placeholder="Enter your phone number"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </Button>
              <Link href="/profile">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>

        {/* Additional Info */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
          <p className="text-sm text-gray-600">
            Your email address is used to log into your account. Changing your email may require re-verification for security purposes.
          </p>
        </Card>
      </div>
    </div>
  )
}
