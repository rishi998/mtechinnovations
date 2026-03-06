import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions - MTech Innovations',
  description: 'Read our terms and conditions for using MTech Innovations e-commerce platform.',
}

export default function TermsPage() {
  const lastUpdated = 'January 1, 2025'

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container-custom max-w-4xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms & Conditions</h1>
              <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Please read these terms and conditions carefully before using the MTech Innovations platform.
            By accessing or using our service, you agree to be bound by these terms.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using the MTech Innovations website and services, you accept and agree to be bound by
              these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use
              our services. MTech Innovations is a brand owned by Maurya Enterprises.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Use of the Platform</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>You agree to use our platform only for lawful purposes and in a manner that does not infringe the rights of others. Specifically, you agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide false or misleading information during registration or checkout</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to scrape or interact with our platform</li>
                <li>Engage in fraudulent transactions or payment activities</li>
                <li>Reproduce, duplicate, or resell any part of our platform without permission</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Product Information</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that
              product descriptions or other content is accurate, complete, reliable, or error-free. Prices are subject
              to change without notice. In the event of a pricing error, we reserve the right to cancel any orders
              placed at the incorrect price.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Orders and Payment</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>When you place an order, you are making an offer to purchase the product(s). We reserve the right to accept or decline your order for any reason. An order is confirmed only when you receive an order confirmation.</p>
              <p>We accept payments via Credit/Debit Cards, UPI, and Net Banking. All transactions are processed securely. We do not store your payment details on our servers.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Shipping and Delivery</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We aim to dispatch orders within 1-2 business days. Standard delivery takes 3-5 business days. Delivery times may vary during peak seasons or due to unforeseen circumstances.</p>
              <p>Free shipping is available on orders above ₹500. A shipping charge of ₹50 applies to orders below this threshold.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Returns and Refunds</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We offer a 7-day return policy from the date of delivery. Products must be returned in their original condition, unused, and in original packaging.</p>
              <p>Refunds are processed within 5-7 business days after we receive the returned product. Refunds will be credited to the original payment method.</p>
              <p>Some products may not be eligible for returns due to their nature (e.g., opened electronic components). Please review product-specific return policies before purchasing.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content on this platform, including text, graphics, logos, images, and software, is the property of
              MTech Innovations / Maurya Enterprises and is protected by applicable intellectual property laws. You may
              not use any content without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, MTech Innovations shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of our platform or products purchased through it.
              Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of India. Any disputes
              shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
              <p><strong>MTech Innovations (Maurya Enterprises)</strong></p>
              <p>123 Electronics Street, Mumbai, Maharashtra 400001</p>
              <p>Email: <a href="mailto:info@electrostore.com" className="text-primary-600 hover:underline">info@electrostore.com</a></p>
              <p>Phone: <a href="tel:+911234567890" className="text-primary-600 hover:underline">+91 123 456 7890</a></p>
            </div>
          </section>
        </div>

        {/* Bottom Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Also read our{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline font-medium">Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/shipping-returns" className="text-primary-600 hover:underline font-medium">Shipping & Returns Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
