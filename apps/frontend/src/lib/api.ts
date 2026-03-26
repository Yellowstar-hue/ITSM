import axios from 'axios'

// When NEXT_PUBLIC_API_URL is set (separate API service on Railway),
// call the API directly. Otherwise fall back to the Next.js proxy (/api/*).
const baseURL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor - inject auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const state = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    const token = state?.state?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
