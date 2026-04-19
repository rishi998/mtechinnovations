export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayConstructorOptions {
  key: string
  /** Optional when `order_id` is set — Razorpay reads amount/currency from the order. */
  amount?: number
  currency?: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>
  /** Omit invalid fields; bad `contact` often breaks card OTP on Razorpay. */
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

export interface RazorpayInstance {
  open: () => void
}

declare global {
  interface Window {
    /** Razorpay Checkout constructor (loaded from checkout.js). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK options evolve; cast at call site if needed
    Razorpay: any
  }
}

export {}
