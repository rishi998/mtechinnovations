import { Users, Target, Award, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">About ElectroStore</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Your trusted partner for electronics, robotics, and DIY projects since 2020
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>
                ElectroStore was founded in 2020 with a simple mission: to make electronics components and 
                robotics supplies accessible to everyone—from hobbyists and students to professional engineers 
                and makers.
              </p>
              <p>
                What started as a small online store has grown into one of India&apos;s most trusted electronics 
                component suppliers. We pride ourselves on offering authentic products, competitive prices, 
                and exceptional customer service.
              </p>
              <p>
                Today, we serve thousands of customers across India, providing everything from Arduino boards 
                and Raspberry Pi to sensors, motors, and complete robotics kits. Our commitment to quality and 
                customer satisfaction remains unwavering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality First</h3>
              <p className="text-gray-600">
                We source only authentic products from trusted manufacturers
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Focus</h3>
              <p className="text-gray-600">
                Your satisfaction is our top priority, always
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                Supporting makers and innovators with the best tools
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Passion</h3>
              <p className="text-gray-600">
                We love what we do and it shows in our service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">5,000+</div>
              <div className="text-gray-600">Products</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600">Brands</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
