import { getPublicApiUrl } from '@/lib/env/publicApi'
import { getToken } from './client'

const API_BASE = getPublicApiUrl()

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as unknown

  if (!res.ok) {
    const raw = (data as { message?: string | string[] }).message
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : res.statusText
    throw new Error(message || `Request failed: ${res.status}`)
  }

  return data as T
}

export interface CreateOrderPaymentResponse {
  razorpayOrderId: string
  amount: number
  key: string
}

export interface VerifyRazorpayResponse {
  success: boolean
  orderId: string
  zohoSynced: boolean
  zohoSalesOrderId?: string | null
  zohoInvoiceId?: string | null
}

/**
 * Creates a Razorpay order for checkout. Calls NestJS
 * `POST /api/orders/create-payment` with Bearer auth.
 */
export async function createOrderPayment(
  orderId: string,
): Promise<CreateOrderPaymentResponse> {
  return postJson<CreateOrderPaymentResponse>('/orders/create-payment', {
    orderId,
  })
}

/**
 * Verifies Razorpay signature and finalizes the order server-side.
 * `POST /api/razorpay/verify`
 */
export async function verifyRazorpayPayment(body: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<VerifyRazorpayResponse> {
  return postJson<VerifyRazorpayResponse>('/razorpay/verify', body)
}
