import { z } from 'zod'
import { CREATABLE_EMPLOYEE_ROLES } from './types'

export const employeeFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(CREATABLE_EMPLOYEE_ROLES),
  designation: z.string().trim().min(1, 'Designation is required').max(200),
  managerId: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  joiningDate: z.string().optional().or(z.literal('')),
  leavingDate: z.string().optional().or(z.literal('')),
  employeeCode: z.string().trim().max(50).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  emergencyContactName: z.string().trim().max(200).optional().or(z.literal('')),
  emergencyContactPhone: z.string().trim().max(30).optional().or(z.literal('')),
})
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
})
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>
