"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (userData: User, userToken: string) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for stored authentication data
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
    
    setLoading(false)
  }, [])

  useEffect(() => {
    // Redirect logic after loading is complete
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/signup'
      
      if (!user && !isAuthPage) {
        // User not authenticated and not on auth page - redirect to login
        router.push('/login')
      } else if (user && isAuthPage) {
        // User authenticated but on auth page - redirect to dashboard
        router.push('/')
      }
    }
  }, [user, loading, pathname, router])

  const login = (userData: User, userToken: string) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
