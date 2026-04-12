import { api } from './client'

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

export async function createOrderPayment(
  orderId: string,
): Promise<CreateOrderPaymentResponse> {
  return api.post<CreateOrderPaymentResponse>('/orders/create-payment', {
    orderId,
  })
}

export async function verifyRazorpayPayment(body: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<VerifyRazorpayResponse> {
  return api.post<VerifyRazorpayResponse>('/razorpay/verify', body)
}
