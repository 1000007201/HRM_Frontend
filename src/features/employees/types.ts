export const EMPLOYEE_ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

// The backend only allows creating/editing employees into these three roles —
// ADMIN is assigned exclusively at company registration.
export const CREATABLE_EMPLOYEE_ROLES = ['HR', 'MANAGER', 'EMPLOYEE'] as const
export type CreatableEmployeeRole = (typeof CREATABLE_EMPLOYEE_ROLES)[number]

export interface Employee {
  id: string
  userId: string | null
  organizationId: string
  fullName: string
  email: string
  designation: string | null
  role: EmployeeRole
  invitedAt: string | null
  managerId: string | null
  createdAt: string
  updatedAt: string
  manager: { id: string; fullName: string } | null
}

export interface EmployeeListResult {
  employees: Employee[]
  page: number
  pageSize: number
  total: number
}

export interface CreateEmployeeInput {
  fullName: string
  email: string
  role: CreatableEmployeeRole
  designation?: string
  managerId?: string
}

export interface UpdateEmployeeInput {
  fullName?: string
  email?: string
  role?: CreatableEmployeeRole
  designation?: string | null
  managerId?: string | null
}

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: string | null
  status: string
  expiresAt: string
  createdAt: string
  inviterId: string
}

export interface InvitationLink {
  url: string
  invitation: { id: string; email: string; role: string | null; expiresAt: string }
}
