import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('career_rec_access')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const storeTokens = (access: string, refresh: string) => {
  localStorage.setItem('career_rec_access', access)
  localStorage.setItem('career_rec_refresh', refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('career_rec_access')
  localStorage.removeItem('career_rec_refresh')
}
