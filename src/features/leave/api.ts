import { apiFetch } from '../../lib/apiClient'
import type {
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  PendingLeaveRequest,
} from './types'

export function listLeaveTypes() {
  return apiFetch<{ leaveTypes: LeaveType[] }>('/leave/types')
}

export function createLeaveType(input: CreateLeaveTypeInput) {
  return apiFetch<{ leaveType: LeaveType }>('/leave/types', {
    method: 'POST',
    body: JSON.stringify(input),
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
