import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { formatInr } from '../../features/expenses/display'
import { formatPeriod, monthName } from '../../features/payroll/display'
import {
  useApprovePayrollRun,
  useCancelPayrollRun,
  useCreatePayrollRun,
  usePayPayrollRun,
  usePayrollRuns,
  useProcessPayrollRun,
  useReprocessPayrollRun,
} from '../../features/payroll/hooks'
import { PayrollRunStatusBadge } from '../../features/payroll/StatusBadge'
import type { PayrollRun } from '../../features/payroll/types'
import { createPayrollRunFormSchema, type CreatePayrollRunFormValues } from '../../features/payroll/validation'

const PAGE_SIZE = 20

function defaultPeriod(): { month: number; year: number } {
  // Payroll is typically run for the previous month.
  const now = new Date()
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { month: previous.getMonth() + 1, year: previous.getFullYear() }
}

function CreateRunModal({ onClose }: { onClose: () => void }) {
  const createPayrollRun = useCreatePayrollRun()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePayrollRunFormValues>({
    resolver: zodResolver(createPayrollRunFormSchema),
    defaultValues: defaultPeriod(),
  })

  async function handleFormSubmit(values: CreatePayrollRunFormValues) {
    setServerError('')
    try {
      const { run } = await createPayrollRun.mutateAsync(values)
      onClose()
      navigate(`/payroll/${run.id}`)
    } catch (error) {
      setServerError(errorMessage(error, 'Could not create the payroll run. Please try again.'))
    }
  }

  return (
    <Modal title="Run payroll" onClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
        )}
        <div className="grid grid-cols-2 gap-x-4">
          <FormSelect id="month" label="Month" errorMessage={errors.month?.message} {...register('month', { valueAsNumber: true })}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={month}>
                {monthName(month)}
              </option>
            ))}
          </FormSelect>
          <FormInput
            id="year"
            label="Year"
            type="number"
            errorMessage={errors.year?.message}
            {...register('year', { valueAsNumber: true })}
          />
        </div>
        <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
          Create run
        </Button>
      </form>
    </Modal>
  )
}

function RunActions({ run }: { run: PayrollRun }) {
  const processPayrollRun = useProcessPayrollRun()
  const reprocessPayrollRun = useReprocessPayrollRun()
  const approvePayrollRun = useApprovePayrollRun()
  const payPayrollRun = usePayPayrollRun()
  const cancelPayrollRun = useCancelPayrollRun()
  const [rowError, setRowError] = useState('')

  async function run_(action: () => Promise<unknown>) {
    setRowError('')
    try {
      await action()
    } catch (error) {
      setRowError(errorMessage(error, 'Could not update this run.'))
    }
  }

  const stop = (event: React.MouseEvent) => event.stopPropagation()

  return (
    <div onClick={stop} className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-1.5">
        {run.status === 'DRAFT' && (
          <>
            <Button fullWidth={false} isLoading={processPayrollRun.isPending} onClick={() => run_(() => processPayrollRun.mutateAsync(run.id))}>
              Process
            </Button>
            <Button
              variant="secondary"
              fullWidth={false}
              isLoading={cancelPayrollRun.isPending}
              onClick={() => run_(() => cancelPayrollRun.mutateAsync(run.id))}
            >
              Cancel
            </Button>
          </>
        )}
        {run.status === 'PROCESSING' && (
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-primary" />
            Processing...
          </span>
        )}
        {run.status === 'REVIEW' && (
          <>
            <Button fullWidth={false} isLoading={approvePayrollRun.isPending} onClick={() => run_(() => approvePayrollRun.mutateAsync(run.id))}>
              Approve
            </Button>
            <Button
              variant="secondary"
              fullWidth={false}
              isLoading={reprocessPayrollRun.isPending}
              onClick={() => run_(() => reprocessPayrollRun.mutateAsync(run.id))}
            >
              Reprocess
            </Button>
            <Button
              variant="secondary"
              fullWidth={false}
              isLoading={cancelPayrollRun.isPending}
              onClick={() => run_(() => cancelPayrollRun.mutateAsync(run.id))}
            >
              Cancel
            </Button>
          </>
        )}
        {run.status === 'APPROVED' && (
          <Button fullWidth={false} isLoading={payPayrollRun.isPending} onClick={() => run_(() => payPayrollRun.mutateAsync(run.id))}>
            Mark paid
          </Button>
        )}
      </div>
      {rowError && <p className="text-xs text-error">{rowError}</p>}
    </div>
  )
}

export function PayrollRunsPage() {
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const navigate = useNavigate()
  const { data, isPending, isError, error } = usePayrollRuns(page, PAGE_SIZE)
  const { canManageEmployees } = useActiveMemberRole()

  if (!canManageEmployees) {
    return <p className="text-sm text-muted">You don't have access to payroll.</p>
  }

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load payroll runs. Please try again.')}</p>
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Payroll runs</h1>
        <Button fullWidth={false} onClick={() => setIsCreateOpen(true)}>
          Run payroll
        </Button>
      </div>

      {isCreateOpen && <CreateRunModal onClose={() => setIsCreateOpen(false)} />}

      {data.total === 0 ? (
        <p className="text-sm text-muted">No payroll runs yet.</p>
      ) : (
        <>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 font-medium">Period</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Employees</th>
                <th className="py-2 font-medium">Total net</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.payrollRuns.map((run) => (
                <tr
                  key={run.id}
                  onClick={() => navigate(`/payroll/${run.id}`)}
                  className={`cursor-pointer border-b border-border last:border-0 hover:bg-row-hover ${
                    run.status === 'CANCELLED' ? 'opacity-50' : ''
                  }`}
                >
                  <td className="py-2 text-ink-2">{formatPeriod(run.month, run.year)}</td>
                  <td className="py-2">
                    <PayrollRunStatusBadge status={run.status} />
                  </td>
                  <td className="py-2 text-ink-2">{run._count.payslips}</td>
                  <td className="py-2 text-ink-2">{run.totalNet !== null ? formatInr(run.totalNet) : '—'}</td>
                  <td className="py-2">
                    <RunActions run={run} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              Page {data.page} of {totalPages} ({data.total} total)
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth={false} disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
