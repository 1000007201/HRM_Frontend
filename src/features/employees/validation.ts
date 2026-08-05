import { z } from 'zod'
import { CREATABLE_EMPLOYEE_ROLES } from './types'

export const employeeFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(CREATABLE_EMPLOYEE_ROLES),
  designation: z.string().trim().max(200).optional().or(z.literal('')),
  managerId: z.string().optional().or(z.literal('')),
})
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>
