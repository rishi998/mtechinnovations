const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token)
  }
}

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options
  const url = params
    ? `${API_BASE}${path}?${new URLSearchParams(params).toString()}`
    : `${API_BASE}${path}`
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(url, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.message || (Array.isArray(data.message) ? data.message.join(', ') : res.statusText)
    throw new Error(message || `Request failed: ${res.status}`)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
