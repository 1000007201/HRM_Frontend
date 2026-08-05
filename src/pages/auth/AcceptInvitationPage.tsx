import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { authClient } from '../../lib/auth-client'
import { MAX_PASSWORD_LENGTH, acceptInvitationSchema, type AcceptInvitationFormValues } from '../../lib/validation'

export function AcceptInvitationPage() {
  const { invitationId } = useParams<{ invitationId: string }>()
  const navigate = useNavigate()
  const { data: session, isPending: isSessionLoading } = authClient.useSession()

  const [errorMessage, setErrorMessage] = useState('')
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationFormValues>({ resolver: zodResolver(acceptInvitationSchema) })
  const password = watch('password') ?? ''

  async function acceptAndRedirect() {
    const { error } = await authClient.organization.acceptInvitation({ invitationId: invitationId! })
    if (error) {
      // Better Auth's own messages here are already user-facing: "Invitation
      // not found", "You are not the recipient of the invitation", etc.
      setErrorMessage(error.message ?? 'Could not accept the invitation. Please try again.')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  async function handleAcceptAsSignedInUser() {
    setErrorMessage('')
    setIsAccepting(true)
    try {
      await acceptAndRedirect()
    } finally {
      setIsAccepting(false)
    }
  }

  async function onCreateAccountSubmit(values: AcceptInvitationFormValues) {
    setErrorMessage('')
    setNeedsEmailVerification(false)
    try {
      const { data, error } = await authClient.signUp.email({
        name: values.fullName,
        email: values.email,
        password: values.password,
      })
      if (error) {
        setErrorMessage(error.message ?? 'Could not create your account. Please try again.')
        return
      }
      if (!data.token) {
        // Email verification is required before sign-up establishes a session —
        // accepting needs an authenticated session, so this can't proceed yet.
        setNeedsEmailVerification(true)
        return
      }
      await acceptAndRedirect()
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.')
    }
  }

  if (!invitationId) {
    return (
      <AuthLayout>
        <h1 className="mb-2 text-lg font-semibold text-heading">Invitation not found</h1>
        <p className="text-sm text-body">This invitation link is missing its invitation ID.</p>
      </AuthLayout>
    )
  }

  if (isSessionLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center py-4">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
        </div>
      </AuthLayout>
    )
  }

  if (needsEmailVerification) {
    return (
      <AuthLayout>
        <h1 className="mb-2 text-lg font-semibold text-heading">Verify your email</h1>
        <p className="text-sm text-body">
          Check your inbox for a verification link, then open this invitation link again to finish joining.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="mb-2 text-lg font-semibold text-heading">Join your organization</h1>
      {errorMessage && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
          {errorMessage}
        </p>
      )}
      {session ? (
        <>
          <p className="mb-6 text-sm text-secondary">Signed in as {session.user.email}.</p>
          <Button onClick={handleAcceptAsSignedInUser} isLoading={isAccepting}>
            Accept invitation
          </Button>
        </>
      ) : (
        <>
          <p className="mb-6 text-sm text-secondary">
            Create your account using the email address this invitation was sent to.
          </p>
          <form onSubmit={handleSubmit(onCreateAccountSubmit)}>
            <FormInput
              id="email"
              label="Email"
              type="email"
              disabled={isSubmitting}
              errorMessage={errors.email?.message}
              {...register('email')}
            />
            <FormInput
              id="fullName"
              label="Your full name"
              disabled={isSubmitting}
              errorMessage={errors.fullName?.message}
              {...register('fullName')}
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
              Create account and join
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
