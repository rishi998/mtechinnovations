'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been confirmed and will be processed soon.
        </p>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <span className="text-sm text-gray-600">Order Number</span>
            <span className="font-semibold text-gray-900">{orderId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated Delivery</span>
            <span className="font-semibold text-gray-900">3-5 Business Days</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/orders" className="block">
            <Button size="lg" className="w-full">
              <Package className="w-5 h-5 mr-2" />
              View Order Details
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" size="lg" className="w-full">
              <Home className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            📧 Order confirmation email has been sent to your registered email address
          </p>
        </div>
      </motion.div>
    </div>
  )
}
