export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

// HR/ADMIN can only meaningfully set these by hand — HOLIDAY and WEEK_OFF are
// derived from the calendar/weekend, never stored per employee.
export const MARKABLE_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'] as const

export type AttendanceSource = 'SELF' | 'HR_MARKED' | 'SYSTEM' | 'REGULARIZED'

// `status: null` is the backend's "not determined yet" — a working day that
// hasn't happened or isn't over, with no record. Deliberately not a status.
export interface DerivedDay {
  date: string
  status: AttendanceStatus | null
  checkInAt: string | null
  checkOutAt: string | null
  workedMinutes: number | null
  source: AttendanceSource | null
  note: string | null
}

export interface OrgDayEntry {
  employee: { id: string; fullName: string }
  day: DerivedDay
}

export interface AttendanceRecord {
  id: string
  date: string
  checkInAt: string | null
  checkOutAt: string | null
  workedMinutes: number | null
  status: AttendanceStatus
  source: AttendanceSource
  note: string | null
}

export const REGULARIZATION_TYPES = ['MISSING_PUNCH', 'WRONG_TIME', 'WFH', 'OTHER'] as const
export type RegularizationType = (typeof REGULARIZATION_TYPES)[number]

export const REGULARIZATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const
export type RegularizationStatus = (typeof REGULARIZATION_STATUSES)[number]

export interface Regularization {
  id: string
  organizationId: string
  employeeId: string
  date: string
  type: RegularizationType
  requestedCheckInAt: string | null
  requestedCheckOutAt: string | null
  requestedStatus: AttendanceStatus | null
  reason: string
  status: RegularizationStatus
  decidedByEmployeeId: string | null
  decidedAt: string | null
  decisionNote: string | null
  createdAt: string
  updatedAt: string
}

// The approver queue joins in the requester plus the day's CURRENT derived
// state, so the queue can show before/after without a second request.
export interface PendingRegularization extends Regularization {
  employee: { id: string; fullName: string }
  current: {
    status: AttendanceStatus | null
    checkInAt: string | null
    checkOutAt: string | null
    workedMinutes: number | null
  }
}

export interface MarkAttendanceInput {
  employeeId: string
  date: string
  status?: AttendanceStatus
  checkInAt?: string
  checkOutAt?: string
  note?: string
}

export interface CreateRegularizationInput {
  date: string
  type: RegularizationType
  requestedCheckInAt?: string
  requestedCheckOutAt?: string
  requestedStatus?: AttendanceStatus
  reason: string
}
