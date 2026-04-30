export { api, setToken, removeToken, getToken } from './client'

export type { LoginResponse, RegisterResponse } from './auth'
export {
  login as apiLogin,
  register as apiRegister,
  getProfile,
  putUserAddresses,
  logout as apiLogout,
} from './auth'

export { getCart, addToCart, updateCartItem, removeFromCart } from './cart'

export {
  getProducts,
  getProductBySlugOrId,
  mapServerProductDoc,
  deriveCategoriesFromProducts,
  slugifyCatalogLabel,
} from './catalog'

export type { CreateOrderPayload, SyncZohoResponse } from './orders'
export {
  createOrder,
  getOrders,
  getOrderById,
  syncZohoForPaidOrder,
} from './orders'

export type {
  CreateOrderPaymentResponse,
  VerifyRazorpayResponse,
} from './payments'
export { createOrderPayment, verifyRazorpayPayment } from './payments'
