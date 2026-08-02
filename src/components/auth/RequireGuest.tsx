import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { authClient } from '../../lib/auth-client'

interface RequireGuestProps {
  children: ReactNode
}

export function RequireGuest({ children }: RequireGuestProps) {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return children
}
