export const CART_ADDED_EVENT = 'ecomm:cart-added'

export const APP_LOGOUT_EVENT = 'ecomm:app-logout'

export type CartAddedDetail = { productName: string }

export function dispatchCartAdded(productName: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, {
      detail: { productName },
    }),
  )
}

export function dispatchAppLogout() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(APP_LOGOUT_EVENT))
}
