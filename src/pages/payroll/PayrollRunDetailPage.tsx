import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/Spinner'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { formatInr } from '../../features/expenses/display'
import { payslipsZipDownloadUrl } from '../../features/payroll/api'
import { formatPeriod } from '../../features/payroll/display'
import {
  useApprovePayrollRun,
  useCancelPayrollRun,
  usePayPayrollRun,
  usePayrollRun,
  usePayslipsForRun,
  useProcessPayrollRun,
  useRegeneratePayslipPdfs,
  useReprocessPayrollRun,
} from '../../features/payroll/hooks'
import { PayslipDetailModal } from '../../features/payroll/PayslipDetailModal'
import { PayrollRunStatusBadge } from '../../features/payroll/StatusBadge'

const PDF_AVAILABLE_STATUSES = new Set(['APPROVED', 'PAID'])

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-canvas p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
    </div>
  )
}

export function PayrollRunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const id = runId ?? ''
  const { data, isPending, isError, error } = usePayrollRun(id)
  const payslips = usePayslipsForRun(id)
  const { canManageEmployees } = useActiveMemberRole()

  const processPayrollRun = useProcessPayrollRun()
  const reprocessPayrollRun = useReprocessPayrollRun()
  const approvePayrollRun = useApprovePayrollRun()
  const payPayrollRun = usePayPayrollRun()
  const cancelPayrollRun = useCancelPayrollRun()
  const regeneratePayslipPdfs = useRegeneratePayslipPdfs()
  const [actionError, setActionError] = useState('')
  const [regenerateMessage, setRegenerateMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [openPayslipId, setOpenPayslipId] = useState<string | null>(null)

  const filteredPayslips = useMemo(() => {
    if (!payslips.data) return []
    const term = searchTerm.trim().toLowerCase()
    if (term === '') return payslips.data.payslips
    return payslips.data.payslips.filter((payslip) => payslip.employee.fullName.toLowerCase().includes(term))
  }, [payslips.data, searchTerm])

  if (!canManageEmployees) {
    return <p className="text-sm text-muted">You don't have access to payroll.</p>
  }

  if (isPending) {
    return <LoadingState />
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-error">
        {error instanceof ApiError && error.status === 404 ? 'Payroll run not found.' : 'Could not load this payroll run.'}
      </p>
    )
  }

  const { run } = data

  async function runAction(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update this run.'))
    }
  }

  async function handleRegenerate() {
    setActionError('')
    setRegenerateMessage('')
    try {
      await regeneratePayslipPdfs.mutateAsync(run.id)
      setRegenerateMessage('PDF regeneration queued.')
    } catch (error) {
      setActionError(errorMessage(error, 'Could not queue PDF regeneration.'))
    }
  }

  return (
    <div>
      <Link to="/payroll" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to payroll runs
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-ink">{formatPeriod(run.month, run.year)}</h1>
          <PayrollRunStatusBadge status={run.status} />
        </div>
        <div className="flex gap-2">
          {run.status === 'DRAFT' && (
            <>
              <Button fullWidth={false} isLoading={processPayrollRun.isPending} onClick={() => runAction(() => processPayrollRun.mutateAsync(run.id))}>
                Process
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                isLoading={cancelPayrollRun.isPending}
                onClick={() => runAction(() => cancelPayrollRun.mutateAsync(run.id))}
              >
                Cancel
              </Button>
            </>
          )}
          {run.status === 'REVIEW' && (
            <>
              <Button fullWidth={false} isLoading={approvePayrollRun.isPending} onClick={() => runAction(() => approvePayrollRun.mutateAsync(run.id))}>
                Approve
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                isLoading={reprocessPayrollRun.isPending}
                onClick={() => runAction(() => reprocessPayrollRun.mutateAsync(run.id))}
              >
                Reprocess
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                isLoading={cancelPayrollRun.isPending}
                onClick={() => runAction(() => cancelPayrollRun.mutateAsync(run.id))}
              >
                Cancel
              </Button>
            </>
          )}
          {run.status === 'APPROVED' && (
            <Button fullWidth={false} isLoading={payPayrollRun.isPending} onClick={() => runAction(() => payPayrollRun.mutateAsync(run.id))}>
              Mark paid
            </Button>
          )}
          {PDF_AVAILABLE_STATUSES.has(run.status) && (
            <>
              <a
                href={payslipsZipDownloadUrl(run.id)}
                className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-ink-2 hover:bg-row-hover"
              >
                <Download className="h-3.5 w-3.5" />
                Download all (ZIP)
              </a>
              <Button variant="secondary" fullWidth={false} isLoading={regeneratePayslipPdfs.isPending} onClick={handleRegenerate}>
                Regenerate PDFs
              </Button>
            </>
          )}
        </div>
      </div>
      {actionError && <p className="mb-4 text-sm text-error">{actionError}</p>}
      {regenerateMessage && (
        <p className="mb-4 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-ink-2">{regenerateMessage}</p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Total gross" value={run.totalGross !== null ? formatInr(run.totalGross) : '—'} />
        <SummaryCard label="Total deductions" value={run.totalDeductions !== null ? formatInr(run.totalDeductions) : '—'} />
        <SummaryCard label="Total net" value={run.totalNet !== null ? formatInr(run.totalNet) : '—'} />
        <SummaryCard label="Total employer cost" value={run.totalEmployerCost !== null ? formatInr(run.totalEmployerCost) : '—'} />
        <SummaryCard label="Employees" value={String(run._count.payslips)} />
        <SummaryCard
          label="LOP days total"
          value={String((payslips.data?.payslips ?? []).reduce((sum, payslip) => sum + payslip.lopDays, 0))}
        />
      </div>

      <div className="mb-4 w-64">
        <label htmlFor="payslipSearch" className="mb-1 block text-sm font-medium text-ink-2">
          Search employee
        </label>
        <input
          id="payslipSearch"
          type="search"
          placeholder="Employee name"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {payslips.isPending ? (
        <LoadingState padding="py-4" />
      ) : payslips.isError ? (
        <p className="text-sm text-error">{errorMessage(payslips.error, 'Could not load payslips.')}</p>
      ) : filteredPayslips.length === 0 ? (
        <p className="text-sm text-muted">No payslips match.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="py-2 font-medium">Employee</th>
              <th className="py-2 font-medium">Gross</th>
              <th className="py-2 font-medium">Deductions</th>
              <th className="py-2 font-medium">Net pay</th>
              <th className="py-2 font-medium">LOP days</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPayslips.map((payslip) => (
              <tr key={payslip.id} className="border-b border-border last:border-0 hover:bg-row-hover">
                <td className="py-2 text-ink-2">{payslip.employee.fullName}</td>
                <td className="py-2 text-ink-2">{formatInr(payslip.grossEarnings)}</td>
                <td className="py-2 text-ink-2">{formatInr(payslip.totalDeductions)}</td>
                <td className="py-2 text-ink-2">{formatInr(payslip.netPay)}</td>
                <td className="py-2 text-ink-2">{payslip.lopDays}</td>
                <td className="py-2 text-right">
                  <button type="button" onClick={() => setOpenPayslipId(payslip.id)} className="text-sm text-primary hover:underline">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openPayslipId && <PayslipDetailModal runId={run.id} payslipId={openPayslipId} onClose={() => setOpenPayslipId(null)} />}
    </div>
  )
}
