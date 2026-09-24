export const EXPENSE_STATUSES = [
  'PENDING_MANAGER',
  'PENDING_ADMIN',
  'APPROVED',
  'PAYMENT_INITIATED',
  'REJECTED',
  'CANCELLED',
] as const
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

export interface ExpenseType {
  id: string
  name: string
  isActive: boolean
}

export interface Currency {
  code: string
  name: string
}

// GET /currencies/rate — inrPerUnit/rateDate come over the wire as strings
// (Prisma Decimal/Date serialize via toJSON, not as numbers).
export interface CurrencyRate {
  currency: string
  inrPerUnit: string
  rateDate: string
}

// GET /expenses/approvers — only employees who have at least one report.
export interface Approver {
  id: string
  fullName: string
  designation: string | null
}

export interface ExpenseAttachment {
  id: string
  fileName: string
  mimeType: string
  fileSize: number
  createdAt: string
}

// amount/exchangeRate/amountInInr come over the wire as strings (Prisma
// Decimal serializes via toJSON to a decimal string, not a number) — same
// convention as LeaveType.accrualPerMonth etc.
export interface ExpenseRequest {
  id: string
  title: string
  description: string | null
  // @db.Date — an ISO instant at UTC midnight, so format with timeZone: 'UTC'
  // (formatCalendarDate) or it renders a day early west of Greenwich.
  expenseDate: string
  amount: string
  currency: string
  exchangeRate: string
  amountInInr: string
  rateDate: string
  status: ExpenseStatus
  managerDecidedAt: string | null
  managerDecisionNote: string | null
  adminDecidedById: string | null
  adminDecidedAt: string | null
  adminDecisionNote: string | null
  paymentInitiatedById: string | null
  paymentInitiatedAt: string | null
  createdAt: string
  updatedAt: string
  employee: { id: string; fullName: string }
  approverManager: { id: string; fullName: string }
  expenseType: { id: string; name: string }
  // Only present on GET /expenses/:id, not on the list endpoints.
  attachments?: ExpenseAttachment[]
}

export interface CreateExpenseRequestInput {
  expenseTypeId: string
  approverManagerId: string
  title: string
  description?: string
  // "YYYY-MM-DD" — the backend coerces it to UTC midnight.
  expenseDate: string
  amount: number
  currency: string
}

export interface CreateExpenseTypeInput {
  name: string
}

export interface UpdateExpenseTypeInput {
  name?: string
  isActive?: boolean
}
