import { apiFetch } from '../../lib/apiClient'
import type {
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  PendingLeaveRequest,
  UpdateLeaveTypeInput,
} from './types'

export function listLeaveTypes(all?: boolean) {
  const query = all ? '?all=true' : ''
  return apiFetch<{ leaveTypes: LeaveType[] }>(`/leave/types${query}`)
}

export function createLeaveType(input: CreateLeaveTypeInput) {
  return apiFetch<{ leaveType: LeaveType }>('/leave/types', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateLeaveType(id: string, input: UpdateLeaveTypeInput) {
  return apiFetch<{ leaveType: LeaveType }>(`/leave/types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function toggleLeaveTypeActive(id: string) {
  return apiFetch<{ leaveType: LeaveType }>(`/leave/types/${id}/toggle`, { method: 'PATCH' })
}

export function updateFloaterQuota(annualGrantDays: number) {
  return apiFetch<{ leaveType: LeaveType }>('/admin/leave/floater/quota', {
    method: 'PATCH',
    body: JSON.stringify({ annualGrantDays }),
  })
}

export function getMyLeaveBalances() {
  return apiFetch<{ year: number; balances: LeaveBalance[] }>('/leave/balances/me')
}

export function createLeaveRequest(input: CreateLeaveRequestInput) {
  return apiFetch<{ leaveRequest: LeaveRequest }>('/leave/requests', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listMyLeaveRequests(status?: LeaveStatus) {
  const query = status ? `?status=${status}` : ''
  return apiFetch<{ leaveRequests: LeaveRequest[] }>(`/leave/requests/me${query}`)
}

export function cancelLeaveRequest(id: string) {
  return apiFetch<{ leaveRequest: LeaveRequest }>(`/leave/requests/${id}/cancel`, { method: 'POST' })
}

export function listPendingLeaveRequests() {
  return apiFetch<{ leaveRequests: PendingLeaveRequest[] }>('/leave/requests/pending')
}

export function approveLeaveRequest(id: string, decisionNote?: string) {
  return apiFetch<{ leaveRequest: LeaveRequest }>(`/leave/requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}

export function rejectLeaveRequest(id: string, decisionNote?: string) {
  return apiFetch<{ leaveRequest: LeaveRequest }>(`/leave/requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}
