import Link from 'next/link'
import { Truck, RotateCcw, Clock, MapPin, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Shipping & Returns - MTech Innovations',
  description: 'Learn about our shipping policies, delivery timelines, and return/refund process.',
}

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-ds-primary py-8 sm:py-12">
      <div className="container-custom max-w-4xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-accent mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ds-text-primary mb-3">Shipping & Returns</h1>
          <p className="text-ds-text-secondary max-w-xl mx-auto">
            Everything you need to know about how we ship your orders and our hassle-free return process.
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹500', color: 'text-blue-600 bg-blue-100' },
            { icon: Clock, title: '3-5 Days', desc: 'Standard delivery', color: 'text-green-600 bg-green-100' },
            { icon: RotateCcw, title: '7-Day Returns', desc: 'Hassle-free returns', color: 'text-orange-600 bg-orange-100' },
            { icon: MapPin, title: 'Pan India', desc: 'Delivery available', color: 'text-purple-600 bg-purple-100' },
          ].map((item) => (
            <div key={item.title} className="border border-ds-border bg-ds-surface rounded-xl shadow-sm p-5 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.color} mb-3`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-ds-text-primary">{item.title}</h3>
              <p className="text-sm text-ds-text-secondary mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Shipping Policy */}
        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ds-text-primary">Shipping Policy</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">Shipping Charges</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ds-primary">
                      <th className="text-left p-3 font-semibold text-ds-text-secondary rounded-l-lg">Order Value</th>
                      <th className="text-left p-3 font-semibold text-ds-text-secondary">Delivery Time</th>
                      <th className="text-left p-3 font-semibold text-ds-text-secondary rounded-r-lg">Shipping Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ds-border">
                    <tr>
                      <td className="p-3 text-ds-text-secondary">Below ₹500</td>
                      <td className="p-3 text-ds-text-secondary">3-5 business days</td>
                      <td className="p-3 text-ds-text-secondary">₹50</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ds-text-secondary">₹500 and above</td>
                      <td className="p-3 text-ds-text-secondary">3-5 business days</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <CheckCircle className="w-4 h-4" /> FREE
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ds-text-secondary">Any amount</td>
                      <td className="p-3 text-ds-text-secondary">1-2 business days</td>
                      <td className="p-3 text-ds-text-secondary">₹99 (Express)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">Delivery Zones & Timelines</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { zone: 'Metro Cities', cities: 'Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad', time: '2-3 business days' },
                  { zone: 'Tier 1 & 2 Cities', cities: 'Pune, Ahmedabad, Jaipur, Lucknow, and more', time: '3-4 business days' },
                  { zone: 'Remote Areas', cities: 'Other areas across India', time: '5-7 business days' },
                ].map((zone) => (
                  <div key={zone.zone} className="p-4 bg-ds-primary rounded-xl">
                    <h4 className="font-semibold text-ds-text-primary text-sm mb-1">{zone.zone}</h4>
                    <p className="text-xs text-ds-text-secondary mb-2">{zone.cities}</p>
                    <p className="text-sm font-medium text-ds-accent">{zone.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">Order Processing</h3>
              <ul className="space-y-2 text-sm text-ds-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Orders placed before 2:00 PM (IST) are dispatched the same business day
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Orders placed after 2:00 PM are dispatched the next business day
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Orders are not processed on Sundays and public holidays
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  You will receive an email with tracking details once your order is dispatched
                </li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">Shipping Disclaimer</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Delivery timelines are estimates and may vary due to factors beyond our control such as
                    weather conditions, logistics delays, or remote locations. We are not responsible for delays
                    caused by third-party courier services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Returns Policy */}
        <div className="border border-ds-border bg-ds-surface rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ds-text-primary">Returns & Refunds Policy</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">Return Eligibility</h3>
              <p className="text-ds-text-secondary text-sm mb-3">
                We accept returns within 7 days of delivery, provided the following conditions are met:
              </p>
              <ul className="space-y-2 text-sm text-ds-text-secondary">
                {[
                  'Product is in its original, unused condition',
                  'All original packaging, accessories, and manuals are included',
                  'Product is not physically damaged due to misuse',
                  'Return is initiated within 7 days of delivery',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">Non-Returnable Items</h3>
              <ul className="space-y-2 text-sm text-ds-text-secondary">
                {[
                  'Opened consumable electronic components (capacitors, resistors, etc.)',
                  'Products with broken seals or signs of use',
                  'Products damaged due to improper handling or installation',
                  'Items marked as "Non-Returnable" on the product page',
                  'Software and downloaded digital products',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">How to Initiate a Return</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Contact Us', desc: 'Email us at returns@electrostore.com or call +91 123 456 7890 within 7 days of delivery' },
                  { step: '2', title: 'Provide Details', desc: 'Share your order ID, reason for return, and photos of the product' },
                  { step: '3', title: 'Receive Approval', desc: "We'll review your request and send you a return authorization within 24 hours" },
                  { step: '4', title: 'Ship the Product', desc: 'We arrange free pickup or you can ship it to our warehouse' },
                  { step: '5', title: 'Get Refund', desc: 'Refund is processed within 5-7 business days after we receive the product' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 bg-ds-accent text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-ds-text-primary text-sm">{item.title}</p>
                      <p className="text-sm text-ds-text-secondary">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ds-text-primary mb-3">Refund Timeline</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ds-primary">
                      <th className="text-left p-3 font-semibold text-ds-text-secondary rounded-l-lg">Payment Method</th>
                      <th className="text-left p-3 font-semibold text-ds-text-secondary rounded-r-lg">Refund Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ds-border">
                    <tr>
                      <td className="p-3 text-ds-text-secondary">Credit / Debit Card</td>
                      <td className="p-3 text-ds-text-secondary">5-7 business days</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ds-text-secondary">UPI / Net Banking</td>
                      <td className="p-3 text-ds-text-secondary">3-5 business days</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-ds-text-secondary">Store Credit</td>
                      <td className="p-3 text-ds-text-secondary">Instant</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-ds-accent rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Need Help?</h2>
          <p className="text-ds-text-primary mb-4 text-sm">
            Have questions about your shipment or return? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-ds-border bg-ds-surface text-ds-accent rounded-lg font-semibold hover:bg-ds-primary transition-colors text-sm"
            >
              Contact Support
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center justify-center rounded-lg border border-ds-text-primary px-6 py-3 text-sm font-semibold text-ds-text-primary transition-colors hover:brightness-110"
            >
              Track My Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
