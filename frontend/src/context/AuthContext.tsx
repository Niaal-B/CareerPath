import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { clearTokens } from '../lib/api'
import { fetchCurrentUser } from '../services/auth'

export type AuthUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'admin'
  phone?: string
  qualification?: string
  interests?: string
}

type AuthContextShape = {
  user: AuthUser | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    const token = localStorage.getItem('career_rec_access')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await fetchCurrentUser()
      setUser(data)
    } catch (error) {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
