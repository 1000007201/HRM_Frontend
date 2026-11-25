import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { Modal } from '../../components/ui/Modal'
import { errorMessage } from '../../lib/apiClient'
import { RequestStatusBadge } from '../../components/ui/RequestStatusBadge'
import { LoadingState } from '../../components/ui/Spinner'
import {
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useLeaveTypes,
  useMyLeaveBalances,
  useMyLeaveRequests,
} from '../../features/leave/hooks'
import { useOptionalHolidays } from '../../features/holidays/hooks'
import { LEAVE_STATUSES, type LeaveStatus } from '../../features/leave/types'
import { applyLeaveFormSchema, type ApplyLeaveFormValues } from '../../features/leave/validation'

const STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const floaterDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const floaterDateKey = (isoDate: string): string => isoDate.slice(0, 10)

function BalanceCards() {
  const { data, isPending, isError } = useMyLeaveBalances()

  if (isPending) return <LoadingState size="sm" padding="py-4" />
  if (isError) return <p className="text-sm text-error">Could not load leave balances.</p>
  if (data.balances.length === 0) return <p className="text-sm text-muted">No leave types configured yet.</p>

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {data.balances.map((balance) => {
        const available = parseFloat(balance.availableDays)
        return (
          <div key={balance.leaveTypeId} className="rounded-xl border border-border bg-panel p-4 shadow-sm">
            <p className="text-sm font-medium text-ink">{balance.name}</p>
            <p className={`mt-2 text-3xl font-bold leading-none ${available > 0 ? 'text-primary' : 'text-muted'}`}>
              {balance.availableDays}
            </p>
            <p className="mt-1 text-xs text-muted">
              available &middot; {balance.accruedDays} accrued, {balance.usedDays} used
            </p>
          </div>
        )
      })}
    </div>
  )
}

function RequestHistory() {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | undefined>(undefined)
  const { data, isPending, isError } = useMyLeaveRequests(statusFilter)
  const cancelLeaveRequest = useCancelLeaveRequest()

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-medium text-ink">Request history</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter(undefined)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              statusFilter === undefined ? 'bg-primary text-white' : 'bg-canvas text-ink-2 hover:bg-row-hover'
            }`}
          >
            All
          </button>
          {LEAVE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                statusFilter === status ? 'bg-primary text-white' : 'bg-canvas text-ink-2 hover:bg-row-hover'
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <p className="text-sm text-error">Could not load your leave requests.</p>
      ) : data.leaveRequests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {statusFilter ? 'No requests match this filter.' : 'No leave requests yet — apply for your first one.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2.5">
              <thead>
                <tr className="border-b border-border bg-neutral text-xs text-ink-2">
                  <th className="font-medium">Type</th>
                  <th className="font-medium">Dates</th>
                  <th className="font-medium">Working days</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium" />
                </tr>
              </thead>
              <tbody className="bg-panel">
                {data.leaveRequests.map((leaveRequest) => (
                  <tr key={leaveRequest.id} className="border-b border-border last:border-0 hover:bg-row-hover">
                    <td className="text-ink-2">{leaveRequest.leaveType.name}</td>
                    <td className="text-ink-2">
                      {new Date(leaveRequest.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                      {leaveRequest.startDate !== leaveRequest.endDate &&
                        ` – ${new Date(leaveRequest.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}`}
                      {leaveRequest.isHalfDay && ' (half-day)'}
                    </td>
                    <td className="text-ink-2">{leaveRequest.workingDays}</td>
                    <td>
                      <RequestStatusBadge status={leaveRequest.status} />
                    </td>
                    <td className="text-right">
                      {leaveRequest.status === 'PENDING' && (
                        <Button
                          variant="secondary"
                          fullWidth={false}
                          isLoading={cancelLeaveRequest.isPending && cancelLeaveRequest.variables === leaveRequest.id}
                          onClick={() => cancelLeaveRequest.mutate(leaveRequest.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cancelLeaveRequest.isError && (
            <p className="mt-3 text-sm text-error">
              {errorMessage(cancelLeaveRequest.error, 'Could not cancel the request.')}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ApplyLeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: leaveTypesData, isPending: isLeaveTypesPending, isError: isLeaveTypesError } = useLeaveTypes()
  const { data: balancesData } = useMyLeaveBalances()
  const { data: optionalHolidaysData } = useOptionalHolidays(new Date().getUTCFullYear())
  const createLeaveRequest = useCreateLeaveRequest()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplyLeaveFormValues>({
    resolver: zodResolver(applyLeaveFormSchema),
    defaultValues: { leaveTypeId: '', startDate: '', endDate: '', isHalfDay: false, reason: '' },
  })

  const leaveTypeId = watch('leaveTypeId')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  const selectedLeaveType = leaveTypesData?.leaveTypes.find((lt) => lt.id === leaveTypeId)
  const selectedBalance = balancesData?.balances.find((b) => b.leaveTypeId === leaveTypeId)
  const isFloater = Boolean(selectedLeaveType?.isFloater)
  const optionalHolidays = optionalHolidaysData?.holidays ?? []
  const isSingleDay = startDate.length > 0 && startDate === endDate
  const canUseHalfDay = !isFloater && Boolean(selectedLeaveType?.allowHalfDay) && isSingleDay

  useEffect(() => {
    setValue('startDate', '')
    setValue('endDate', '')
    setValue('isHalfDay', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveTypeId])

  // Default end date to start date on first pick
  useEffect(() => {
    if (startDate && !endDate) setValue('endDate', startDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate])

  async function handleFormSubmit(values: ApplyLeaveFormValues) {
    setServerError('')
    try {
      await createLeaveRequest.mutateAsync({
        leaveTypeId: values.leaveTypeId,
        startDate: values.startDate,
        endDate: values.endDate,
        isHalfDay: values.isHalfDay && canUseHalfDay,
        reason: values.reason || undefined,
      })
      onSuccess()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not submit the leave request. Please try again.'))
    }
  }

  const availableDays = selectedBalance ? parseFloat(selectedBalance.availableDays) : null

  return (
    <Modal title="Apply for leave" onClose={onClose}>
      {isLeaveTypesPending ? (
        <LoadingState />
      ) : isLeaveTypesError ? (
        <p className="text-sm text-error">Could not load leave types.</p>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {serverError && (
            <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
              {serverError}
            </p>
          )}
          <FormSelect
            id="leaveTypeId"
            label="Leave type"
            placeholder="Select a leave type"
            disabled={isSubmitting}
            errorMessage={errors.leaveTypeId?.message}
            {...register('leaveTypeId')}
          >
            {leaveTypesData.leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </FormSelect>
          {selectedBalance && (
            <p className={`-mt-2 mb-4 text-sm ${availableDays! > 0 ? 'text-muted' : 'text-warning'}`}>
              You have <span className="font-medium text-ink">{selectedBalance.availableDays}</span> days available
              {availableDays === 0 && ' — this request may be rejected'}
            </p>
          )}

          {isFloater ? (
            <FormSelect
              id="startDate"
              label="Optional holiday date"
              placeholder="Select an optional holiday"
              disabled={isSubmitting}
              errorMessage={errors.startDate?.message ?? errors.endDate?.message}
              {...register('startDate', {
                onChange: (event) => setValue('endDate', event.target.value, { shouldValidate: true }),
              })}
            >
              {optionalHolidays.map((holiday) => (
                <option key={holiday.id} value={floaterDateKey(holiday.date)}>
                  {floaterDateFormatter.format(new Date(holiday.date))} — {holiday.name}
                </option>
              ))}
            </FormSelect>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  id="startDate"
                  label="Start date"
                  type="date"
                  disabled={isSubmitting}
                  errorMessage={errors.startDate?.message}
                  {...register('startDate')}
                />
                <FormInput
                  id="endDate"
                  label="End date"
                  type="date"
                  disabled={isSubmitting}
                  errorMessage={errors.endDate?.message}
                  {...register('endDate')}
                />
              </div>
              {canUseHalfDay && (
                <label className="mb-4 flex items-center gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    disabled={isSubmitting}
                    {...register('isHalfDay')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-accent/20"
                  />
                  Half-day
                </label>
              )}
              {errors.isHalfDay && <p className="-mt-3 mb-4 text-sm text-error">{errors.isHalfDay.message}</p>}
            </>
          )}

          <div className="mb-4">
            <label htmlFor="reason" className="mb-1 block text-sm font-medium text-ink-2">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-md border border-border px-3 py-2 text-sm text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              {...register('reason')}
            />
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            Submit request
          </Button>
        </form>
      )}
    </Modal>
  )
}

export function MyLeavePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function handleApplySuccess() {
    setIsDrawerOpen(false)
    setSuccessMessage('Leave request submitted successfully.')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">My leave</h1>
        <Button fullWidth={false} onClick={() => { setSuccessMessage(''); setIsDrawerOpen(true) }}>
          Apply for leave
        </Button>
      </div>

      {successMessage && (
        <p className="mb-4 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-ink-2">
          {successMessage}
        </p>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-ink">Balances</h2>
        <BalanceCards />
      </div>

      <RequestHistory />

      {isDrawerOpen && <ApplyLeaveModal onClose={() => setIsDrawerOpen(false)} onSuccess={handleApplySuccess} />}
    </div>
  )
}
