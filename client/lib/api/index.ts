export { api, setToken, removeToken, getToken } from './client'

export type { LoginResponse, RegisterResponse } from './auth'
export { login as apiLogin, register as apiRegister, getProfile, logout as apiLogout } from './auth'

export { getCart, addToCart, updateCartItem, removeFromCart } from './cart'

export type { CreateOrderPayload } from './orders'
export { createOrder, getOrders, getOrderById } from './orders'
