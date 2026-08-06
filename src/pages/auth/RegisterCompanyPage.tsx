import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { API_BASE_URL, authClient } from '../../lib/auth-client'
import { MAX_PASSWORD_LENGTH, registerCompanySchema, type RegisterCompanyFormValues } from '../../lib/validation'

export function RegisterCompanyPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCompanyFormValues>({ resolver: zodResolver(registerCompanySchema) })
  const password = watch('password') ?? ''

  async function onSubmit(values: RegisterCompanyFormValues) {
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/register-company`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Registration-Secret': import.meta.env.VITE_REGISTRATION_SECRET ?? '',
        },
        body: JSON.stringify({
          companyName: values.companyName,
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        }),
      })
      if (response.ok) {
        // This fetch bypasses authClient, so its reactive session state doesn't
        // know about the new cookie yet — force it to refresh before routing in.
        await authClient.getSession()
        navigate('/dashboard', { replace: true })
        return
      }
      const body: { error?: { message?: string } } | null = await response.json().catch(() => null)
      setErrorMessage(
        response.status === 429
          ? 'Too many attempts. Please wait a moment and try again.'
          : (body?.error?.message ?? 'Could not register your company. Please try again.'),
      )
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.')
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="companyName"
          label="Company name"
          disabled={isSubmitting}
          errorMessage={errors.companyName?.message}
          {...register('companyName')}
        />
        <FormInput
          id="fullName"
          label="Your full name"
          disabled={isSubmitting}
          errorMessage={errors.fullName?.message}
          {...register('fullName')}
        />
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
        <p className="-mt-3 mb-4 text-xs text-secondary">
          {password.length}/{MAX_PASSWORD_LENGTH} characters
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
          Create company
        </Button>
      </form>
    </AuthLayout>
  )
}
