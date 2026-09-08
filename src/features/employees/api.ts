import { apiFetch } from '../../lib/apiClient'
import { API_BASE_URL } from '../../lib/auth-client'
import type {
  CreateDepartmentInput,
  CreateEmployeeInput,
  Department,
  Employee,
  EmployeeDocument,
  EmployeeDocumentType,
  EmployeeListResult,
  Invitation,
  InvitationLink,
  OrgChartNode,
  UpdateDepartmentInput,
  UpdateEmployeeInput,
} from './types'

export function listEmployees(page: number, pageSize: number) {
  return apiFetch<EmployeeListResult>(`/api/employees?page=${page}&pageSize=${pageSize}`)
}

export function getEmployee(id: string) {
  return apiFetch<{ employee: Employee }>(`/api/employees/${id}`)
}

export function createEmployee(input: CreateEmployeeInput) {
  return apiFetch<{ employee: Employee }>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateEmployee(id: string, input: UpdateEmployeeInput) {
  return apiFetch<{ employee: Employee }>(`/api/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function inviteEmployee(id: string) {
  return apiFetch<{ invitation: Invitation }>(`/api/employees/${id}/invite`, { method: 'POST' })
}

export function getInvitationLink(id: string) {
  return apiFetch<InvitationLink>(`/api/employees/${id}/invite-link`)
}

export function listInvitations() {
  return apiFetch<{ invitations: Invitation[] }>('/api/invitations')
}

export function cancelInvitation(id: string) {
  return apiFetch<{ invitation: Invitation }>(`/api/invitations/${id}/cancel`, { method: 'POST' })
}

export function getOrgChart() {
  return apiFetch<{ tree: OrgChartNode[] }>('/api/employees/org-chart')
}

export function listEmployeeDocuments(employeeId: string) {
  return apiFetch<{ documents: EmployeeDocument[] }>(`/api/employees/${employeeId}/documents`)
}

export function uploadEmployeeDocument(employeeId: string, type: EmployeeDocumentType, file: File) {
  const formData = new FormData()
  // `type` must come before `file` — the backend reads it off the fields
  // collected while streaming up to the file part.
  formData.append('type', type)
  formData.append('file', file)
  return apiFetch<{ document: EmployeeDocument }>(`/api/employees/${employeeId}/documents`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteEmployeeDocument(employeeId: string, documentId: string) {
  return apiFetch<{ deleted: boolean }>(`/api/employees/${employeeId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

// Session cookie rides along on a plain top-level navigation, so downloads
// are a normal <a href> rather than a fetch-and-blob dance.
export function employeeDocumentDownloadUrl(employeeId: string, documentId: string) {
  return `${API_BASE_URL}/api/employees/${employeeId}/documents/${documentId}/download`
}

export function listDepartments() {
  return apiFetch<{ departments: Department[] }>('/api/departments')
}

export function createDepartment(input: CreateDepartmentInput) {
  return apiFetch<{ department: Department }>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateDepartment(id: string, input: UpdateDepartmentInput) {
  return apiFetch<{ department: Department }>(`/api/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteDepartment(id: string) {
  return apiFetch<{ deleted: boolean }>(`/api/departments/${id}`, { method: 'DELETE' })
}
