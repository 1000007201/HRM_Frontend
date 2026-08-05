import { apiFetch } from '../../lib/apiClient'
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeListResult,
  Invitation,
  InvitationLink,
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
