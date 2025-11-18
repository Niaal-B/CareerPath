import { api } from '../lib/api'

export type RegistrationPayload = {
  email: string
  password: string
  first_name: string
  last_name: string
  qualification: string
  interests: string
}

export type LoginPayload = {
  email: string
  password: string
}

export const registerStudent = async (payload: RegistrationPayload) => {
  const response = await api.post('auth/register/', payload)
  return response.data
}

export const login = async (payload: LoginPayload) => {
  const response = await api.post('auth/token/', payload)
  return response.data as { access: string; refresh: string; user: unknown }
}

export const fetchCurrentUser = async () => {
  const response = await api.get('auth/me/')
  return response.data
}
