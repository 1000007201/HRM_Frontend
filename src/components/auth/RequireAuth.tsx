import { Navigate, Outlet } from 'react-router-dom'
import { authClient } from '../../lib/auth-client'
import { Spinner } from '../ui/Spinner'

export function RequireAuth() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-50">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
