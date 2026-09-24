import type { ExpenseStatus } from './types'

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING_MANAGER: 'Pending manager',
  PENDING_ADMIN: 'Pending admin',
  APPROVED: 'Approved',
  PAYMENT_INITIATED: 'Payment initiated',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

// @db.Date fields (expenseDate, rateDate) arrive as UTC midnight — format in
// UTC or they render a day early. Same reason as employees/display.ts.
const calendarDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

export function formatExpenseDate(value: string): string {
  return calendarDateFormatter.format(new Date(value))
}

const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export function formatInr(amount: string | number): string {
  return inrFormatter.format(Number(amount))
}

// One formatter per currency code, reused across renders/rows rather than
// constructed fresh each time — Intl.NumberFormat construction isn't free.
const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: string | number, currency: string): string {
  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency })
    moneyFormatters.set(currency, formatter)
  }
  return formatter.format(Number(amount))
}
