import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { authClient } from '../../lib/auth-client'

export function SignInPage() {
  const location = useLocation()
  const redirectMessage = (location.state as { message?: string } | null)?.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)
    try {
      const { error } = await authClient.signIn.email({ email, password })
      if (error) {
        setErrorMessage(
          error.status === 429
            ? 'Too many attempts. Please wait a moment and try again.'
            : (error.message ?? 'Could not sign in. Please try again.'),
        )
      }
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="mb-6 text-lg font-semibold text-heading">Sign in</h1>
      {redirectMessage && !errorMessage && (
        <p className="mb-4 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-body">
          {redirectMessage}
        </p>
      )}
      {errorMessage && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
          {errorMessage}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <FormInput
          id="email"
          label="Email"
          type="email"
          required
          disabled={isLoading}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormInput
          id="password"
          label="Password"
          type="password"
          required
          disabled={isLoading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" isLoading={isLoading}>
          Sign in
        </Button>
      </form>
      <Link to="/forgot-password" className="mt-4 block text-center text-sm text-primary-300 hover:underline">
        Forgot password?
      </Link>
    </AuthLayout>
  )
}
