import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { authClient } from '../../lib/auth-client'
import { MAX_PASSWORD_LENGTH, resetPasswordSchema, type ResetPasswordFormValues } from '../../lib/validation'

type SubmitStatus = 'idle' | 'rateLimited' | 'invalidToken' | 'networkError'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const tokenError = searchParams.get('error')
  const navigate = useNavigate()

  const [status, setStatus] = useState<SubmitStatus>(tokenError === 'INVALID_TOKEN' ? 'invalidToken' : 'idle')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) })
  const newPassword = watch('newPassword') ?? ''

  if (!token && status !== 'invalidToken') {
    return <Navigate to="/forgot-password" replace />
  }

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      const { error } = await authClient.resetPassword({ newPassword: values.newPassword, token: token! })
      if (!error) {
        // Resetting revokes every session for this user — send them to sign in again, not into the app.
        navigate('/login', {
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="newPassword"
          label="New password"
          type="password"
          disabled={isSubmitting}
          errorMessage={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <p className="-mt-3 mb-4 text-xs text-secondary">
          {newPassword.length}/{MAX_PASSWORD_LENGTH} characters
        </p>
        <FormInput
          id="confirmPassword"
          label="Confirm password"
          type="password"
          disabled={isSubmitting}
          errorMessage={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}
