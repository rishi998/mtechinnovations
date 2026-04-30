'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { User, Order, Address } from '../types'
import { generateId } from '../utils'
import {
  apiLogin,
  apiRegister,
  getProfile,
  putUserAddresses,
  apiLogout,
  getToken,
} from '../api'
import { dispatchAppLogout } from '@/lib/cartEvents'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<void>
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>
  updateAddress: (addressId: string, address: Partial<Address>) => Promise<void>
  deleteAddress: (addressId: string) => Promise<void>
  addOrder: (order: Omit<Order, 'id'>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const profile = await getProfile()
      setUser(profile)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: u } = await apiLogin(email, password)
      setUser(u)
      return true
    } catch {
      return false
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    try {
      const { user: u } = await apiRegister(name, email, password, phone)
      setUser(u)
      return { ok: true }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Registration failed. Please try again.'
      return { ok: false, message }
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
    dispatchAppLogout()
  }

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return
    if (userData.addresses !== undefined) {
      const updated = await putUserAddresses(userData.addresses)
      setUser(updated)
      return
    }
    setUser((prev) => (prev ? { ...prev, ...userData } : null))
  }

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!user) return
    const existing = user.addresses ?? []
    const id = generateId()
    const isFirst = existing.length === 0
    const isDefault = address.isDefault ?? isFirst
    const newAddr: Address = { ...address, id, isDefault }
    const next: Address[] = isDefault
      ? [...existing.map((a) => ({ ...a, isDefault: false })), newAddr]
      : [...existing, { ...newAddr, isDefault: false }]
    const updated = await putUserAddresses(next)
    setUser(updated)
  }

  const updateAddress = async (addressId: string, address: Partial<Address>) => {
    if (!user) return
    let next = (user.addresses ?? []).map((addr) =>
      addr.id === addressId ? { ...addr, ...address } : addr,
    )
    if (address.isDefault === true) {
      next = next.map((a) => ({ ...a, isDefault: a.id === addressId }))
    }
    const updated = await putUserAddresses(next)
    setUser(updated)
  }

  const deleteAddress = async (addressId: string) => {
    if (!user) return
    const filtered = (user.addresses ?? []).filter((a) => a.id !== addressId)
    let next = filtered
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      next = filtered.map((a, i) => ({ ...a, isDefault: i === 0 }))
    }
    const updated = await putUserAddresses(next)
    setUser(updated)
  }

  const addOrder = (order: Omit<Order, 'id'>) => {
    if (!user) return
    const newOrder: Order = {
      ...order,
      id: generateId(),
    }
    setUser((prev) =>
      prev ? { ...prev, orders: [...prev.orders, newOrder] } : null,
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        addAddress,
        updateAddress,
        deleteAddress,
        addOrder,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
