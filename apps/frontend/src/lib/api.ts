import axios from 'axios'

// Always call the API directly — CORS is open (origin: true) on the backend.
// This avoids the Next.js server-side proxy which requires the frontend container
// to reach the backend URL, adding an unreliable hop.
const API_BASE = 'https://simplenowapi-production.up.railway.app/api'

export const api = axios.create({
  baseURL: API_BASE,
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
