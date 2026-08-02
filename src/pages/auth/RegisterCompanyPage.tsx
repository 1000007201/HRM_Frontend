import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { API_BASE_URL, authClient } from '../../lib/auth-client'

const MIN_PASSWORD_LENGTH = 10
const MAX_PASSWORD_LENGTH = 128

export function RegisterCompanyPage() {
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const meetsLength = password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH
  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password
  const canSubmit = meetsLength && confirmPassword === password

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setErrorMessage('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/register-company`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Registration-Secret': import.meta.env.VITE_REGISTRATION_SECRET ?? '',
        },
        body: JSON.stringify({ companyName, fullName, email, password }),
      })
      if (response.ok) {
        // This fetch bypasses authClient, so its reactive session state doesn't
        // know about the new cookie yet — force it to refresh before routing in.
        await authClient.getSession()
        navigate('/', { replace: true })
        return
      }
      const body: { error?: string } | null = await response.json().catch(() => null)
      setErrorMessage(
        response.status === 429
          ? 'Too many attempts. Please wait a moment and try again.'
          : (body?.error ?? 'Could not register your company. Please try again.'),
      )
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="mb-2 text-lg font-semibold text-heading">Register your company</h1>
      <p className="mb-6 text-sm text-secondary">Internal/dev-only for now — public sign-up is disabled.</p>
      {errorMessage && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
          {errorMessage}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <FormInput
          id="companyName"
          label="Company name"
          required
          disabled={isLoading}
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
        />
        <FormInput
          id="fullName"
          label="Your full name"
          required
          disabled={isLoading}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
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
        <p className="-mt-3 mb-4 text-xs text-secondary">
          {password.length}/{MAX_PASSWORD_LENGTH} characters
          {meetsLength ? ' — meets minimum length' : ` — at least ${MIN_PASSWORD_LENGTH} required`}
        </p>
        <FormInput
          id="confirmPassword"
          label="Confirm password"
          type="password"
          required
          disabled={isLoading}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          errorMessage={!passwordsMatch ? 'Passwords do not match' : undefined}
        />
        <Button type="submit" isLoading={isLoading} disabled={!canSubmit}>
          Create company
        </Button>
      </form>
    </AuthLayout>
  )
}
