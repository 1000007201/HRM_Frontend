export const EMPLOYEE_ROLES = ['ADMIN', 'EMPLOYEE'] as const
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

// Two-role model — the create/edit form offers the same set the type allows,
// unlike the old HR/MANAGER/EMPLOYEE scheme where ADMIN was registration-only.
export const CREATABLE_EMPLOYEE_ROLES = ['ADMIN', 'EMPLOYEE'] as const
export type CreatableEmployeeRole = (typeof CREATABLE_EMPLOYEE_ROLES)[number]

export interface Department {
  id: string
  name: string
  isActive: boolean
}

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
  departmentId: string | null
  department: { id: string; name: string } | null
  joiningDate: string | null
  leavingDate: string | null
  employeeCode: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
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
  departmentId?: string
  joiningDate?: string
  leavingDate?: string
  employeeCode?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface UpdateEmployeeInput {
  fullName?: string
  email?: string
  role?: CreatableEmployeeRole
  designation?: string | null
  managerId?: string | null
  departmentId?: string | null
  joiningDate?: string | null
  leavingDate?: string | null
  employeeCode?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  address?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
}

export interface CreateDepartmentInput {
  name: string
}

export interface UpdateDepartmentInput {
  name?: string
  isActive?: boolean
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

export const EMPLOYEE_DOCUMENT_TYPES = [
  'ADDRESS_PROOF',
  'MARKSHEET',
  'IDENTITY_PROOF',
  'EXPERIENCE_CERTIFICATE',
  'RELIEVING_LETTER',
] as const
export type EmployeeDocumentType = (typeof EMPLOYEE_DOCUMENT_TYPES)[number]

export const EMPLOYEE_DOCUMENT_TYPE_LABELS: Record<EmployeeDocumentType, string> = {
  ADDRESS_PROOF: 'Address proof',
  MARKSHEET: 'Marksheet / degree',
  IDENTITY_PROOF: 'Identity proof',
  EXPERIENCE_CERTIFICATE: 'Experience certificate',
  RELIEVING_LETTER: 'Relieving letter',
}

export interface EmployeeDocument {
  id: string
  employeeId: string
  type: EmployeeDocumentType
  fileName: string
  mimeType: string
  fileSize: number
  createdAt: string
}

export interface OrgChartNode {
  id: string
  fullName: string
  role: EmployeeRole
  designation: string | null
  hasPortalAccess: boolean
  reports: OrgChartNode[]
}
