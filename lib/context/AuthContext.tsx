'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Order, Address } from '../types'
import { generateId } from '../utils'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  addAddress: (address: Omit<Address, 'id'>) => void
  updateAddress: (addressId: string, address: Partial<Address>) => void
  deleteAddress: (addressId: string) => void
  addOrder: (order: Omit<Order, 'id'>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoaded(true)
  }, [])

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    }
  }, [user, isLoaded])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Demo account
    if (email === 'demo@example.com' && password === 'demo123') {
      const demoUser: User = {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        phone: '9876543210',
        addresses: [],
        orders: [],
      }
      setUser(demoUser)
      return true
    }
    
    // Check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const foundUser = users.find(
      (u: any) => u.email === email && u.password === password
    )
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      return true
    }
    
    return false
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const exists = users.some((u: any) => u.email === email)
    
    if (exists) {
      return false
    }
    
    // Create new user
    const newUser: User & { password: string } = {
      id: generateId(),
      email,
      name,
      phone,
      password,
      addresses: [],
      orders: [],
    }
    
    // Save to users list
    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))
    
    // Set as current user (without password)
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    
    return true
  }

  const logout = () => {
    setUser(null)
  }

  const updateUser = (userData: Partial<User>) => {
    if (!user) return
    
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const updatedUsers = users.map((u: any) =>
      u.id === user.id ? { ...u, ...userData } : u
    )
    localStorage.setItem('users', JSON.stringify(updatedUsers))
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
    
    const updatedAddresses = user.addresses.filter((addr) => addr.id !== addressId)
    updateUser({ addresses: updatedAddresses })
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
        login,
        register,
        logout,
        updateUser,
        addAddress,
        updateAddress,
        deleteAddress,
        addOrder,
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
