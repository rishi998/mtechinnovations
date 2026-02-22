import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - MTech Innovations',
  description: 'Learn how MTech Innovations collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
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
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            At MTech Innovations (Maurya Enterprises), we are committed to protecting your privacy. This policy
            explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely, not stored)</li>
                  <li>Account credentials</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Pages visited, products viewed, and search queries</li>
                  <li>Browser type, IP address, and device information</li>
                  <li>Order history and purchase behavior</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 leading-relaxed">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Provide customer support</li>
              <li>Personalize your shopping experience</li>
              <li>Send promotional offers and newsletters (with your consent)</li>
              <li>Improve our platform and services</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, rent, or trade your personal information to third parties. We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>Delivery Partners:</strong> To ship your orders to you</li>
              <li><strong>Payment Processors:</strong> To process your payments securely</li>
              <li><strong>Service Providers:</strong> Who help us operate our platform</li>
              <li><strong>Legal Authorities:</strong> When required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze platform usage, and deliver
              personalized content. You can control cookie settings through your browser. Disabling cookies may
              affect some features of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However, no
              internet transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this
              policy, or as required by law. When you delete your account, we will delete or anonymize your data
              within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your information</li>
              <li>Opt out of marketing communications</li>
              <li>Data portability (receive a copy of your data)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:info@electrostore.com" className="text-primary-600 hover:underline">
                info@electrostore.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe we have collected such information,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date. We encourage you
              to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy-related questions or concerns, please contact our Data Protection Officer:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
              <p><strong>MTech Innovations (Maurya Enterprises)</strong></p>
              <p>123 Electronics Street, Mumbai, Maharashtra 400001</p>
              <p>Email: <a href="mailto:privacy@electrostore.com" className="text-primary-600 hover:underline">privacy@electrostore.com</a></p>
              <p>Phone: <a href="tel:+911234567890" className="text-primary-600 hover:underline">+91 123 456 7890</a></p>
            </div>
          </section>
        </div>

        {/* Bottom Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Also read our{' '}
            <Link href="/terms" className="text-primary-600 hover:underline font-medium">Terms & Conditions</Link>
            {' '}and{' '}
            <Link href="/shipping-returns" className="text-primary-600 hover:underline font-medium">Shipping & Returns Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
