import { notFound } from 'next/navigation'
import { CheckoutPayClient } from './CheckoutPayClient'

/** Satisfies `output: 'export'` (see Next.js static export + dynamic routes). */
const BUILD_PLACEHOLDER_ORDER_ID = '__build_placeholder__'

export function generateStaticParams() {
  return [{ orderId: BUILD_PLACEHOLDER_ORDER_ID }]
}

export default async function CheckoutOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  if (orderId === BUILD_PLACEHOLDER_ORDER_ID) {
    notFound()
  }
  return <CheckoutPayClient orderId={orderId} />
}
