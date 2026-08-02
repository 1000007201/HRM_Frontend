import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { authClient } from '../../lib/auth-client'

type SubmitStatus = 'idle' | 'loading' | 'success' | 'rateLimited' | 'networkError'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setStatus(error?.status === 429 ? 'rateLimited' : 'success')
    } catch {
      setStatus('networkError')
    }
  }

  if (status === 'success') {
    return (
      <AuthLayout>
        <h1 className="mb-2 text-lg font-semibold text-heading">Check your email</h1>
        <p className="text-sm text-body">
          If an account with that email exists, we've sent a reset link.
        </p>
        <Link to="/sign-in" className="mt-4 block text-center text-sm text-primary-300 hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="mb-2 text-lg font-semibold text-heading">Forgot password</h1>
      <p className="mb-6 text-sm text-secondary">
        Enter your email and we'll send you a link to reset your password.
      </p>
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
          id="email"
          label="Email"
          type="email"
          required
          disabled={status === 'loading'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" isLoading={status === 'loading'}>
          Send reset link
        </Button>
      </form>
      <Link to="/login" className="mt-4 block text-center text-sm text-primary-300 hover:underline">
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
