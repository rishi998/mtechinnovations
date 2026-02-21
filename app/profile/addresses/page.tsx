'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, ArrowLeft, Plus, Trash2, Edit2, Check } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  isDefault: z.boolean().optional(),
})

type AddressForm = z.infer<typeof addressSchema>

export default function AddressesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addresses, setAddresses] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user) {
      setAddresses(user.addresses || [])
    }
  }, [isAuthenticated, user, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  })

  const onSubmit = async (data: AddressForm) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (editingId !== null) {
      // Update existing address
      const updatedAddresses = addresses.map((addr, idx) =>
        idx === editingId ? { ...data, id: idx } : addr
      )
      setAddresses(updatedAddresses)
      setEditingId(null)
    } else {
      // Add new address
      const newAddress = { ...data, id: addresses.length }
      setAddresses([...addresses, newAddress])
    }

    reset()
    setShowModal(false)
  }

  const handleEdit = (index: number) => {
    setEditingId(index)
    const address = addresses[index]
    reset({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    })
    setShowModal(true)
  }

  const handleDelete = (index: number) => {
    setAddresses(addresses.filter((_, idx) => idx !== index))
  }

  const handleSetDefault = (index: number) => {
    const updatedAddresses = addresses.map((addr, idx) => ({
      ...addr,
      isDefault: idx === index,
    }))
    setAddresses(updatedAddresses)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    reset()
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
              <p className="text-gray-600">Manage your delivery addresses</p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Address
          </Button>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Addresses Yet</h3>
            <p className="text-gray-600 mb-6">Add your first address to get started with fast checkout</p>
            <Button onClick={() => setShowModal(true)}>Add Address</Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {addresses.map((address, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{address.name}</h3>
                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <Check className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{address.addressLine1}</p>
                    {address.addressLine2 && (
                      <p className="text-gray-600 text-sm mb-1">{address.addressLine2}</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p className="text-gray-600 text-sm">Phone: {address.phone}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(idx)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(idx)}
                    className="text-xs"
                  >
                    Set as Default
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <Modal isOpen={showModal} onClose={handleCloseModal}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingId !== null ? 'Edit Address' : 'Add New Address'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    {...register('name')}
                    placeholder="e.g., Home, Office"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input
                    {...register('phone')}
                    type="tel"
                    placeholder="10-digit phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <Input
                    {...register('addressLine1')}
                    placeholder="Street address"
                    className={errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {errors.addressLine1 && <p className="text-red-600 text-xs mt-1">{errors.addressLine1.message}</p>}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                  <Input
                    {...register('addressLine2')}
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input
                    {...register('city')}
                    placeholder="City"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city.message}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <Input
                    {...register('state')}
                    placeholder="State"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && <p className="text-red-600 text-xs mt-1">{errors.state.message}</p>}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <Input
                    {...register('pincode')}
                    placeholder="6-digit pincode"
                    className={errors.pincode ? 'border-red-500' : ''}
                  />
                  {errors.pincode && <p className="text-red-600 text-xs mt-1">{errors.pincode.message}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId !== null ? 'Update Address' : 'Add Address'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
