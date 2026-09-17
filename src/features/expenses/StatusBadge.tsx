import { EXPENSE_STATUS_LABELS } from './display'
import type { ExpenseStatus } from './types'

// Reuses the shared status color tokens (see CLAUDE.md's "Status" section) —
// PAYMENT_INITIATED shares `success` with APPROVED (both are "good outcome"
// states, distinguished by label text) rather than inventing a new color;
// PENDING_ADMIN borrows `on-leave` to stay visually distinct from
// PENDING_MANAGER while both read as "in progress".
const STATUS_CLASSES: Record<ExpenseStatus, string> = {
  PENDING_MANAGER: 'bg-warning-bg text-warning',
  PENDING_ADMIN: 'bg-on-leave-bg text-on-leave',
  APPROVED: 'bg-success-bg text-success',
  PAYMENT_INITIATED: 'bg-success-bg text-success',
  REJECTED: 'bg-error-bg text-error',
  CANCELLED: 'bg-neutral text-neutral-ink',
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {EXPENSE_STATUS_LABELS[status]}
    </span>
  )
}
