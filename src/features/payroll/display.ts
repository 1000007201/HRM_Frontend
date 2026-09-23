import type { LopBasis, PayrollRunStatus, TaxRegime } from './types'

export const PAYROLL_RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  DRAFT: 'Draft',
  PROCESSING: 'Processing',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

export const LOP_BASIS_LABELS: Record<LopBasis, string> = {
  CALENDAR_DAYS: 'Calendar days',
  WORKING_DAYS: 'Working days',
}

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  OLD: 'Old regime',
  NEW: 'New regime',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month)
}

export function formatPeriod(month: number, year: number): string {
  return `${monthName(month)} ${year}`
}

// April-March, mirroring the backend's financialYearFor (taxSlabs.ts).
export function financialYearFor(month: number, year: number): string {
  const startYear = month >= 4 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

export function currentFinancialYear(): string {
  const now = new Date()
  return financialYearFor(now.getMonth() + 1, now.getFullYear())
}

// Previous, current, and next FY — enough range for a declaration form
// without asking the backend to enumerate valid years.
export function financialYearOptions(): string[] {
  const now = new Date()
  const currentStartYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1
  return [currentStartYear - 1, currentStartYear, currentStartYear + 1].map((startYear) => `${startYear}-${startYear + 1}`)
}
