import { useState } from 'react'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { formatInr } from '../expenses/display'
import { formatPeriod } from './display'
import { useEmployeePayslips } from './hooks'
import { PayslipDetailModal } from './PayslipDetailModal'
import { PayrollRunStatusBadge } from './StatusBadge'

export function PayslipHistoryPanel({ employeeId }: { employeeId: string }) {
  const { data, isPending, isError, error } = useEmployeePayslips(employeeId)
  const [open, setOpen] = useState<{ runId: string; payslipId: string } | null>(null)

  if (isPending) {
    return <LoadingState padding="py-4" />
  }

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load payslips.')}</p>
  }

  if (data.payslips.length === 0) {
    return <p className="text-sm text-muted">No payslips yet.</p>
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {data.payslips.map((payslip) => (
          <li key={payslip.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-2">{formatPeriod(payslip.payrollRun.month, payslip.payrollRun.year)}</span>
              <PayrollRunStatusBadge status={payslip.payrollRun.status} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink">{formatInr(payslip.netPay)}</span>
              <button
                type="button"
                onClick={() => setOpen({ runId: payslip.payrollRunId, payslipId: payslip.id })}
                className="text-sm text-primary hover:underline"
              >
                View
              </button>
            </div>
          </li>
        ))}
      </ul>
      {open && <PayslipDetailModal runId={open.runId} payslipId={open.payslipId} onClose={() => setOpen(null)} />}
    </div>
  )
}
