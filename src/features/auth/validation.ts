import { z } from 'zod'

export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_LENGTH = 128

const email = z.string().min(1, 'Email is required').email('Enter a valid email')
const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`)

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})
export type SignInFormValues = z.infer<typeof signInSchema>

export const forgotPasswordSchema = z.object({ email })
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({ newPassword: password, confirmPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export const registerCompanySchema = z
  .object({
    companyName: z.string().min(1, 'Company name is required'),
    fullName: z.string().min(1, 'Your full name is required'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type RegisterCompanyFormValues = z.infer<typeof registerCompanySchema>

export const acceptInvitationSchema = z
  .object({
    fullName: z.string().min(1, 'Your full name is required'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>
