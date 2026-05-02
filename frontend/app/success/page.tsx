'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Copy,
  Home,
  Loader2,
  Package,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/context/AuthContext'
import { getOrders } from '@/lib/api'
import type { Order } from '@/lib/types'

function zohoStatusLabel(status: Order['zohoSyncStatus'] | undefined): string {
  switch (status) {
    case 'synced':
      return 'Synced with Zoho'
    case 'failed':
      return 'Zoho sync failed (order is still paid)'
    case 'pending':
      return 'Zoho sync pending'
    default:
      return 'Not reported'
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get('orderId')
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  /** Poll order while Zoho invoice is still being created (server runs sync in background). */
  useEffect(() => {
    if (!order?.id || (order.paymentStatus ?? '') !== 'success') return
    if (order.zohoSyncStatus === 'synced' && order.zohoInvoiceId) return

    let n = 0
    const maxPolls = 36
    const id = window.setInterval(() => {
      n += 1
      if (n > maxPolls) {
        clearInterval(id)
        return
      }
      setRefreshKey((k) => k + 1)
    }, 5000)
    return () => clearInterval(id)
  }, [order?.id, order?.paymentStatus, order?.zohoSyncStatus, order?.zohoInvoiceId])

  useEffect(() => {
    if (order?.zohoSyncLastError) {
      console.error('[Zoho sync error]', order.zohoSyncLastError)
    }
  }, [order?.zohoSyncLastError])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      const q = orderNumber
        ? `?redirect=${encodeURIComponent(`/success?orderId=${encodeURIComponent(orderNumber)}`)}`
        : '?redirect=/success'
      router.replace(`/login${q}`)
      return
    }
    if (!orderNumber) {
      setLoading(false)
      setLoadError('Missing order reference in the URL.')
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError('')
      try {
        const list = await getOrders()
        if (cancelled) return
        const found = list.find((o) => o.orderId === orderNumber) ?? null
        setOrder(found)
        if (!found) {
          setLoadError(
            'We could not load this order in your account yet. Your payment may still be processing.',
          )
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : 'Could not load order details.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, orderNumber, router, refreshKey])

  const invoiceBase =
    process.env.NEXT_PUBLIC_ZOHO_INVOICE_BASE_URL?.replace(/\/$/, '') ?? ''

  const invoiceHref =
    order?.zohoInvoiceId && invoiceBase
      ? `${invoiceBase}/${encodeURIComponent(order.zohoInvoiceId)}`
      : null

  const copyInvoiceId = async () => {
    if (!order?.zohoInvoiceId) return
    try {
      await navigator.clipboard.writeText(order.zohoInvoiceId)
    } catch {
      /* ignore */
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ds-primary flex flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="w-10 h-10 text-ds-accent animate-spin" />
        <p className="text-sm text-ds-text-secondary">Loading confirmation…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-primary flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-5"
          >
            <CheckCircle className="w-11 h-11 text-green-600" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ds-text-primary mb-2">
            Payment successful
          </h1>
          <p className="text-ds-text-secondary text-sm sm:text-base">
            Your payment was verified on the server. Thank you for your order.
          </p>
        </div>

        <div className="border border-ds-border bg-ds-surface rounded-xl shadow-sm border border-ds-border p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-ds-border">
            <span className="text-sm text-ds-text-secondary">Order ID</span>
            <span className="font-semibold text-ds-text-primary text-right break-all">
              {orderNumber ?? '—'}
            </span>
          </div>

          {order && (
            <>
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-ds-border">
                <span className="text-sm text-ds-text-secondary">Payment</span>
                <span className="font-medium text-green-700 capitalize">
                  {order.paymentStatus ?? 'success'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-ds-border">
                <span className="text-sm text-ds-text-secondary">Zoho status</span>
                <span className="font-medium text-ds-text-primary text-right">
                  {zohoStatusLabel(order.zohoSyncStatus)}
                </span>
              </div>
              {(order.zohoSalesOrderId || order.zohoInvoiceId) && (
                <div className="text-xs text-ds-text-secondary space-y-1">
                  {order.zohoSalesOrderId && (
                    <p>
                      Sales order:{' '}
                      <span className="font-mono text-ds-text-secondary">
                        {order.zohoSalesOrderId}
                      </span>
                    </p>
                  )}
                  {order.zohoInvoiceId && (
                    <p className="flex flex-wrap items-center gap-2">
                      <span>
                        Invoice:{' '}
                        <span className="font-mono text-ds-text-secondary">
                          {order.zohoInvoiceId}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyInvoiceId()}
                        className="inline-flex items-center gap-1 text-ds-accent hover:brightness-110"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {loadError && (
            <div
              className="rounded-lg bg-amber-50 text-amber-900 text-sm px-3 py-2 border border-amber-100"
              role="status"
            >
              {loadError}
            </div>
          )}
          {order?.zohoSyncLastError ? (
            <div
              className="rounded-lg bg-red-50 text-red-900 text-sm px-3 py-2 border border-red-100"
              role="alert"
            >
              <p className="font-semibold">Zoho could not sync this invoice yet</p>
              <p className="mt-1 break-words text-red-800">{order.zohoSyncLastError}</p>
              <p className="mt-2 text-xs text-red-800/90">
                Your payment succeeded. We will retry automatically, or use Refresh status. Check
                server logs for full details.
              </p>
            </div>
          ) : null}
        </div>

        {invoiceHref && (
          <div className="mb-6 text-center">
            <a
              href={invoiceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ds-accent hover:brightness-110 underline"
            >
              Open invoice in Zoho
            </a>
          </div>
        )}

        <div className="space-y-3">
          {orderNumber && (
            <Link
              href={`/order-detail?orderId=${encodeURIComponent(orderNumber)}`}
              className="block"
            >
              <Button size="lg" className="w-full">
                <Package className="w-5 h-5 mr-2" />
                View order
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            type="button"
            onClick={() => {
              setRefreshKey((k) => k + 1)
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh status
          </Button>
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
        <div className="min-h-screen bg-ds-primary flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-ds-accent animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
