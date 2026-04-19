'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Chrome, Facebook } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setIsLoading(true)

    try {
      const success = await login(data.email, data.password)
      if (success) {
        const next = searchParams.get('redirect')
        const safe =
          next != null &&
          next.startsWith('/') &&
          !next.startsWith('//') &&
          !next.includes('://')
        router.push(safe ? next : '/')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ds-primary flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ds-text-primary mb-2">Welcome Back</h1>
          <p className="text-ds-text-secondary">Login to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-5 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-ds-accent rounded" />
                <span className="text-ds-text-secondary">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-ds-accent hover:brightness-110 font-medium">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Login
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ds-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 border border-ds-border bg-ds-surface text-ds-text-secondary">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" className="w-full">
              <Chrome className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              <Facebook className="w-5 h-5 mr-2" />
              Facebook
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-ds-text-secondary mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-ds-accent hover:brightness-110 font-medium">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-800">Email: demo@example.com</p>
          <p className="text-xs text-blue-800">Password: demo123</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ds-primary flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-ds-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
