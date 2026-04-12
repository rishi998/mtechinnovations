'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Order, Address } from '../types'
import { generateId } from '../utils'
import { apiLogin, apiRegister, getProfile, apiLogout, getToken } from '../api'

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
  updateUser: (userData: Partial<User>) => void
  addAddress: (address: Omit<Address, 'id'>) => void
  updateAddress: (addressId: string, address: Partial<Address>) => void
  deleteAddress: (addressId: string) => void
  addOrder: (order: Omit<Order, 'id'>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
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
  }

  useEffect(() => {
    refreshUser()
  }, [])

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
  }

  const updateUser = (userData: Partial<User>) => {
    if (!user) return
    setUser((prev) => (prev ? { ...prev, ...userData } : null))
  }

  const addAddress = (address: Omit<Address, 'id'>) => {
    if (!user) return
    const newAddress: Address = {
      ...address,
      id: generateId(),
    }
    updateUser({
      addresses: [...user.addresses, newAddress],
    })
  }

  const updateAddress = (addressId: string, address: Partial<Address>) => {
    if (!user) return
    const updatedAddresses = user.addresses.map((addr) =>
      addr.id === addressId ? { ...addr, ...address } : addr
    )
    updateUser({ addresses: updatedAddresses })
  }

  const deleteAddress = (addressId: string) => {
    if (!user) return
    updateUser({
      addresses: user.addresses.filter((addr) => addr.id !== addressId),
    })
  }

  const addOrder = (order: Omit<Order, 'id'>) => {
    if (!user) return
    const newOrder: Order = {
      ...order,
      id: generateId(),
    }
    updateUser({
      orders: [...user.orders, newOrder],
    })
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
