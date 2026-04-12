'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Home, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment successful</h1>
        <p className="text-gray-600 mb-8">
          Your payment was verified on the server. Your order is confirmed and Zoho
          has been updated when inventory sync is enabled.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <span className="text-sm text-gray-600">Order number</span>
            <span className="font-semibold text-gray-900">{orderId ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Next step</span>
            <span className="font-semibold text-gray-900">Processing</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={orderId ? `/order-detail?orderId=${encodeURIComponent(orderId)}` : '/orders'}
            className="block"
          >
            <Button size="lg" className="w-full">
              <Package className="w-5 h-5 mr-2" />
              View order
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" size="lg" className="w-full">
              <Home className="w-5 h-5 mr-2" />
              Continue shopping
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
