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
  const { user, isAuthenticated, addAddress, updateAddress, deleteAddress, updateUser } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')

  const addresses = user?.addresses ?? []

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  })

  const onSubmit = async (data: AddressForm) => {
    setSaveError('')
    try {
      if (editingId !== null) {
        await updateAddress(editingId, {
          name: data.name,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        })
      } else {
        await addAddress({
          name: data.name,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          isDefault: addresses.length === 0,
        })
      }

      reset()
      setShowModal(false)
      setEditingId(null)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save address. Try again.')
    }
  }

  const handleEdit = (id: string) => {
    const address = addresses.find((a) => a.id === id)
    if (!address) return
    setEditingId(id)
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

  const handleDelete = async (id: string) => {
    setSaveError('')
    try {
      await deleteAddress(id)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not delete address.')
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user) return
    setSaveError('')
    try {
      const next = user.addresses.map((a) => ({ ...a, isDefault: a.id === id }))
      await updateUser({ addresses: next })
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not update default.')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    reset()
  }

  const openAddModal = () => {
    setEditingId(null)
    reset()
    setShowModal(true)
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-ds-primary py-8">
      <div className="container-custom max-w-4xl">
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-ds-accent hover:brightness-110">
          <ArrowLeft className="h-5 w-5" />
          Back to Profile
        </Link>

        {saveError && (
          <p className="mb-4 rounded-lg border border-red-800 bg-ds-primary px-4 py-3 text-sm text-red-400">
            {saveError}
          </p>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ds-surface">
              <MapPin className="h-6 w-6 text-ds-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ds-text-primary">Saved Addresses</h1>
              <p className="text-ds-text-secondary">Stored on your account — reused at checkout</p>
            </div>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="mx-auto mb-4 h-16 w-16 text-ds-text-secondary" />
            <h3 className="mb-2 text-lg font-semibold text-ds-text-primary">No Addresses Yet</h3>
            <p className="mb-6 text-ds-text-secondary">Add your first address — it will be saved to your account</p>
            <Button onClick={openAddModal}>Add Address</Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {addresses.map((address) => (
              <Card key={address.id} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-ds-text-primary">{address.name}</h3>
                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-ds-accent bg-ds-primary px-3 py-1 text-xs font-medium text-ds-accent">
                          <Check className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-sm text-ds-text-secondary">{address.addressLine1}</p>
                    {address.addressLine2 && (
                      <p className="mb-1 text-sm text-ds-text-secondary">{address.addressLine2}</p>
                    )}
                    <p className="text-sm text-ds-text-secondary">
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p className="text-sm text-ds-text-secondary">Phone: {address.phone}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(address.id)}
                      className="rounded-lg p-2 text-ds-accent transition hover:bg-ds-primary"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(address.id)}
                      className="rounded-lg p-2 text-red-400 transition hover:bg-ds-primary"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSetDefault(address.id)}
                    className="text-xs"
                  >
                    Set as Default
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={editingId !== null ? 'Edit Address' : 'Add New Address'}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">Label / Name</label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Home, Office"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">Phone</label>
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="10-digit phone number"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">Address Line 1</label>
                <Input
                  {...register('addressLine1')}
                  placeholder="Street address"
                  className={errors.addressLine1 ? 'border-red-500' : ''}
                />
                {errors.addressLine1 && (
                  <p className="mt-1 text-xs text-red-400">{errors.addressLine1.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">
                  Address Line 2 (Optional)
                </label>
                <Input {...register('addressLine2')} placeholder="Apartment, suite, etc." />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">City</label>
                <Input
                  {...register('city')}
                  placeholder="City"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">State</label>
                <Input
                  {...register('state')}
                  placeholder="State"
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && <p className="mt-1 text-xs text-red-400">{errors.state.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ds-text-secondary">Pincode</label>
                <Input
                  {...register('pincode')}
                  placeholder="6-digit pincode"
                  className={errors.pincode ? 'border-red-500' : ''}
                />
                {errors.pincode && <p className="mt-1 text-xs text-red-400">{errors.pincode.message}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId !== null ? 'Update Address' : 'Add Address'}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  )
}
