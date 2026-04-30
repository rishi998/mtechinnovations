import { api, setToken } from './client'
import type { Address, User } from '@/lib/types'

interface ServerUser {
  _id: string
  id?: string
  email: string
  name: string
  phone?: string | null
  role?: string
  addresses?: User['addresses']
  orders?: User['orders']
}

function toClientUser(u: ServerUser): User {
  return {
    id: u._id || u.id || '',
    email: u.email,
    name: u.name,
    phone: u.phone ?? undefined,
    addresses: u.addresses ?? [],
    orders: u.orders ?? [],
  }
}

export interface LoginResponse {
  user: ServerUser
  accessToken: string
}

export interface RegisterResponse {
  user: ServerUser
  accessToken: string
}

export async function login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
  const res = await api.post<LoginResponse>('/auth/login', { email, password })
  setToken(res.accessToken)
  return { user: toClientUser(res.user), accessToken: res.accessToken }
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ user: User; accessToken: string }> {
  const res = await api.post<RegisterResponse>('/auth/register', {
    name,
    email,
    password,
    ...(phone && { phone }),
  })
  setToken(res.accessToken)
  return { user: toClientUser(res.user), accessToken: res.accessToken }
}

export async function getProfile(): Promise<User> {
  const u = await api.get<ServerUser>('/auth/profile')
  return toClientUser(u)
}

/** Replace the user’s saved shipping addresses on the server (full list). */
export async function putUserAddresses(addresses: Address[]): Promise<User> {
  const u = await api.put<ServerUser>('/auth/addresses', { addresses })
  return toClientUser(u)
}

export function logout(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
}
