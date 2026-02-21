'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available at checkout for select locations.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes! We offer free shipping on all orders above ₹500. For orders below ₹500, a flat shipping fee of ₹50 applies.',
      },
      {
        q: 'Can I track my order?',
        a: 'Absolutely! Once your order ships, you\'ll receive a tracking number via email and SMS. You can also track your order in the "My Orders" section.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 7-day return policy from the date of delivery. Products must be in original condition with all packaging and accessories.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Go to "My Orders", select the order, and click "Return Item". We\'ll arrange a free pickup from your address.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 5-7 business days after we receive the returned product. The amount will be credited to your original payment method.',
      },
    ],
  },
  {
    category: 'Products',
    questions: [
      {
        q: 'Are all products genuine?',
        a: 'Yes! We source all products directly from authorized distributors and manufacturers. Every product comes with a warranty.',
      },
      {
        q: 'Do you provide technical support?',
        a: 'Yes, our technical team is available to help with product selection, specifications, and troubleshooting. Contact us via email or phone.',
      },
      {
        q: 'Can I request a product that\'s not listed?',
        a: 'Absolutely! Send us your requirement at support@electrostore.com, and we\'ll do our best to source it for you.',
      },
    ],
  },
  {
    category: 'Payment & Security',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept credit/debit cards, UPI, net banking, and popular digital wallets like Paytm, PhonePe, and Google Pay.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes! All transactions are encrypted using industry-standard SSL technology. We never store your card details.',
      },
      {
        q: 'Can I get an invoice for my purchase?',
        a: 'Yes, a GST invoice is automatically generated for every order and sent to your email. You can also download it from your order history.',
      },
    ],
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary-600 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our products and services
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {category.category}
              </h2>
              <div>
                {category.questions.map((item, qIdx) => (
                  <FAQItem key={qIdx} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-primary-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="text-primary-100 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Please chat with our team.
          </p>
          <a href="/contact">
            <button className="px-8 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Contact Support
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}
