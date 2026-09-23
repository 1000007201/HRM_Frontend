import { Download } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { payslipPdfDownloadUrl } from './api'
import { formatInr } from '../expenses/display'
import { usePayslip } from './hooks'
import { formatPeriod } from './display'
import type { PayslipComponent } from './types'

const PDF_AVAILABLE_STATUSES = new Set(['APPROVED', 'PAID'])

function ComponentRow({ component }: { component: PayslipComponent }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-ink-2">{component.name}</span>
      <span className="text-ink-2">{formatInr(component.amount)}</span>
    </div>
  )
}

export function PayslipDetailModal({ runId, payslipId, onClose }: { runId: string; payslipId: string; onClose: () => void }) {
  const { data, isPending, isError, error } = usePayslip(runId, payslipId)

  return (
    <Modal title="Payslip" onClose={onClose}>
      {isPending && <LoadingState padding="py-6" />}
      {isError && <p className="text-sm text-error">{errorMessage(error, 'Could not load this payslip.')}</p>}
      {data && (
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-ink">{data.payslip.employee.fullName}</p>
              <p className="text-sm text-muted">
                {data.payslip.employee.employeeCode ?? '—'} · {data.payslip.employee.designation ?? '—'} ·{' '}
                {data.payslip.employee.department?.name ?? '—'}
              </p>
              <p className="text-sm text-muted">{formatPeriod(data.payslip.payrollRun.month, data.payslip.payrollRun.year)}</p>
              <p className="text-xs text-muted">
                Paid days: {data.payslip.paidDays} / {data.payslip.daysInMonth} · LOP days: {data.payslip.lopDays}
              </p>
            </div>
            {PDF_AVAILABLE_STATUSES.has(data.payslip.payrollRun.status) && (
              <a
                href={payslipPdfDownloadUrl(data.payslip.employeeId, data.payslip.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-ink-2 hover:bg-row-hover"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-1 border-b border-border pb-1 text-sm font-medium text-ink">Earnings</p>
              {data.payslip.components.filter((c) => c.componentType === 'EARNING').map((c) => (
                <ComponentRow key={c.id} component={c} />
              ))}
            </div>
            <div>
              <p className="mb-1 border-b border-border pb-1 text-sm font-medium text-ink">Deductions</p>
              {data.payslip.components.filter((c) => c.componentType === 'EMPLOYEE_DEDUCTION').map((c) => (
                <ComponentRow key={c.id} component={c} />
              ))}
            </div>
          </div>

          {data.payslip.components.some((c) => c.componentType === 'EMPLOYER_CONTRIBUTION') && (
            <div className="mt-4">
              <p className="mb-1 border-b border-border pb-1 text-sm font-medium text-ink">Employer contributions</p>
              {data.payslip.components.filter((c) => c.componentType === 'EMPLOYER_CONTRIBUTION').map((c) => (
                <ComponentRow key={c.id} component={c} />
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-xs text-muted">Gross earnings</p>
              <p className="text-sm text-ink-2">{formatInr(data.payslip.grossEarnings)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Total deductions</p>
              <p className="text-sm text-ink-2">{formatInr(data.payslip.totalDeductions)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Net pay</p>
              <p className="text-base font-semibold text-ink">{formatInr(data.payslip.netPay)}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
