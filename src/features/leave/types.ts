export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export interface LeaveType {
  id: string
  name: string
  code: string
  accrualPerMonth: string
  annualCap: number
  isPaid: boolean
  allowHalfDay: boolean
}

// accruedDays/usedDays/availableDays come over the wire as strings (Prisma
// Decimal serializes via toJSON to a decimal string, not a number).
export interface LeaveBalance {
  leaveTypeId: string
  code: string
  name: string
  accruedDays: string
  usedDays: string
  availableDays: string
}

export interface LeaveTypeSummary {
  id: string
  name: string
  code: string
}

export interface LeaveRequest {
  id: string
  organizationId: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  isHalfDay: boolean
  reason: string | null
  workingDays: string
  status: LeaveStatus
  decidedByEmployeeId: string | null
  decidedAt: string | null
  decisionNote: string | null
  createdAt: string
  updatedAt: string
  leaveType: LeaveTypeSummary
}

// Only present on /leave/requests/pending — the approver queue joins in the requester.
export interface PendingLeaveRequest extends LeaveRequest {
  employee: { id: string; fullName: string }
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string
  startDate: string
  endDate: string
  isHalfDay: boolean
  reason?: string
}
