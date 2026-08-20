import { apiFetch } from '../../lib/apiClient'
import type {
  AttendanceRecord,
  CreateRegularizationInput,
  DerivedDay,
  MarkAttendanceInput,
  OrgDayEntry,
  PendingRegularization,
  Regularization,
  RegularizationStatus,
} from './types'

export function checkIn() {
  return apiFetch<{ record: AttendanceRecord }>('/attendance/check-in', { method: 'POST' })
}

export function checkOut() {
  return apiFetch<{ record: AttendanceRecord }>('/attendance/check-out', { method: 'POST' })
}

export function getMyMonth(month: string) {
  return apiFetch<{ year: number; month: number; days: DerivedDay[] }>(`/attendance/me?month=${month}`)
}

export function getOrgDay(date: string) {
  return apiFetch<{ date: string; attendance: OrgDayEntry[] }>(`/attendance?date=${date}`)
}

export function getEmployeeMonth(employeeId: string, month: string) {
  return apiFetch<{ employee: { id: string; fullName: string }; year: number; month: number; days: DerivedDay[] }>(
    `/attendance/${employeeId}?month=${month}`,
  )
}

export function markAttendance(input: MarkAttendanceInput) {
  return apiFetch<{ record: AttendanceRecord }>('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function createRegularization(input: CreateRegularizationInput) {
  return apiFetch<{ regularization: Regularization }>('/attendance/regularizations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listMyRegularizations(status?: RegularizationStatus) {
  const query = status ? `?status=${status}` : ''
  return apiFetch<{ regularizations: Regularization[] }>(`/attendance/regularizations/me${query}`)
}

export function cancelRegularization(id: string) {
  return apiFetch<{ regularization: Regularization }>(`/attendance/regularizations/${id}/cancel`, { method: 'POST' })
}

export function listPendingRegularizations() {
  return apiFetch<{ regularizations: PendingRegularization[] }>('/attendance/regularizations/pending')
}

// Approve returns both the decided request AND the attendance record it wrote
// — it's the one endpoint here whose payload isn't a single-key wrapper.
export function approveRegularization(id: string, decisionNote?: string) {
  return apiFetch<{ regularization: Regularization; attendanceRecord: AttendanceRecord }>(
    `/attendance/regularizations/${id}/approve`,
    { method: 'POST', body: JSON.stringify({ decisionNote }) },
  )
}

export function rejectRegularization(id: string, decisionNote?: string) {
  return apiFetch<{ regularization: Regularization }>(`/attendance/regularizations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}
