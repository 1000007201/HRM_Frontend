import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { authClient } from '../../lib/auth-client'
import { signInSchema, type SignInFormValues } from '../../lib/validation'

export function SignInPage() {
  const location = useLocation()
  const redirectMessage = (location.state as { message?: string } | null)?.message

  const [errorMessage, setErrorMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({ resolver: zodResolver(signInSchema) })

  async function onSubmit(values: SignInFormValues) {
    setErrorMessage('')
    try {
      const { error } = await authClient.signIn.email(values)
      if (error) {
        setErrorMessage(
          error.status === 429
            ? 'Too many attempts. Please wait a moment and try again.'
            : (error.message ?? 'Could not sign in. Please try again.'),
        )
      }
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.')
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="email"
          label="Email"
          type="email"
          disabled={isSubmitting}
          errorMessage={errors.email?.message}
          {...register('email')}
        />
        <FormInput
          id="password"
          label="Password"
          type="password"
          disabled={isSubmitting}
          errorMessage={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <Link to="/forgot-password" className="mt-4 block text-center text-sm text-primary-300 hover:underline">
        Forgot password?
      </Link>
    </AuthLayout>
  )
}
