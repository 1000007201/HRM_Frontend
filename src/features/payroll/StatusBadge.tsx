import { PAYROLL_RUN_STATUS_LABELS } from './display'
import type { PayrollRunStatus } from './types'

// Same token reuse as ExpenseStatusBadge: PAID shares `success` with
// APPROVED (both "good outcome", distinguished by label), REVIEW borrows
// `on-leave` to read as "in progress, awaiting a decision" without a new color.
const STATUS_CLASSES: Record<PayrollRunStatus, string> = {
  DRAFT: 'bg-neutral text-neutral-ink',
  PROCESSING: 'bg-warning-bg text-warning',
  REVIEW: 'bg-on-leave-bg text-on-leave',
  APPROVED: 'bg-success-bg text-success',
  PAID: 'bg-success-bg text-success',
  CANCELLED: 'bg-neutral text-neutral-ink',
}

export function PayrollRunStatusBadge({ status }: { status: PayrollRunStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {PAYROLL_RUN_STATUS_LABELS[status]}
    </span>
  )
}
