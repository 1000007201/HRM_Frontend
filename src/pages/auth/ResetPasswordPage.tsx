import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { authClient } from '../../lib/auth-client'

const MIN_PASSWORD_LENGTH = 10
const MAX_PASSWORD_LENGTH = 128

type SubmitStatus = 'idle' | 'loading' | 'rateLimited' | 'invalidToken' | 'networkError'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')

  if (!token) {
    return <Navigate to="/forgot-password" replace />
  }

  const meetsLength = newPassword.length >= MIN_PASSWORD_LENGTH && newPassword.length <= MAX_PASSWORD_LENGTH
  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === newPassword
  const canSubmit = meetsLength && confirmPassword === newPassword

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setStatus('loading')
    try {
      const { error } = await authClient.resetPassword({ newPassword, token: token! })
      if (!error) {
        // Resetting revokes every session for this user — send them to sign in again, not into the app.
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Your password has been reset. Please sign in again.' },
        })
      } else if (error.status === 429) {
        setStatus('rateLimited')
      } else {
        // Any other server error here means the token is bad or expired.
        setStatus('invalidToken')
      }
    } catch {
      setStatus('networkError')
    }
  }

  if (status === 'invalidToken') {
    return (
      <AuthLayout>
        <h1 className="mb-2 text-lg font-semibold text-heading">Link expired</h1>
        <p className="text-sm text-body">This reset link is invalid or has expired.</p>
        <Link to="/forgot-password" className="mt-4 block text-center text-sm text-primary-300 hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="mb-6 text-lg font-semibold text-heading">Reset password</h1>
      {status === 'rateLimited' && (
        <p className="mb-4 rounded-md border border-warning bg-warning-bg px-3 py-2 text-sm text-body">
          Too many attempts. Please wait a moment and try again.
        </p>
      )}
      {status === 'networkError' && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
          Could not reach the server. Check your connection and try again.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <FormInput
          id="newPassword"
          label="New password"
          type="password"
          required
          disabled={status === 'loading'}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <p className="-mt-3 mb-4 text-xs text-secondary">
          {newPassword.length}/{MAX_PASSWORD_LENGTH} characters
          {meetsLength ? ' — meets minimum length' : ` — at least ${MIN_PASSWORD_LENGTH} required`}
        </p>
        <FormInput
          id="confirmPassword"
          label="Confirm password"
          type="password"
          required
          disabled={status === 'loading'}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          errorMessage={!passwordsMatch ? 'Passwords do not match' : undefined}
        />
        <Button type="submit" isLoading={status === 'loading'} disabled={!canSubmit}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}
