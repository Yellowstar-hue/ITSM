import axios from 'axios'

// Use relative URL — browser sends to /api/* which Next.js proxies to
// localhost:3001 (NestJS API running in the same container).
export const api = axios.create({
  baseURL: '/api',
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
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
