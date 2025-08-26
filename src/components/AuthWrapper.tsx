"use client"

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Allow access to auth pages without authentication
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  
  if (!user && !isAuthPage) {
    return null // AuthContext will handle redirect
  }

  return <>{children}</>
}
