import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { errorMessage } from '../../lib/apiClient'
import { useCreateLeaveRequest, useLeaveTypes, useMyLeaveBalances } from '../../features/leave/hooks'
import { applyLeaveFormSchema, type ApplyLeaveFormValues } from '../../features/leave/validation'
import { useOptionalHolidays } from '../../features/holidays/hooks'
import { LoadingState } from '../../components/ui/Spinner'

// Holiday.date is a UTC-midnight instant (see the note on Holiday in
// features/holidays/types.ts) — timeZone: 'UTC' avoids rendering a day early
// west of Greenwich, same fix as elsewhere in this app.
const floaterDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const floaterDateKey = (isoDate: string): string => isoDate.slice(0, 10)

export function ApplyLeavePage() {
  const navigate = useNavigate()
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

  const selectedLeaveType = leaveTypesData?.leaveTypes.find((leaveType) => leaveType.id === leaveTypeId)
  const selectedBalance = balancesData?.balances.find((balance) => balance.leaveTypeId === leaveTypeId)
  const isFloater = Boolean(selectedLeaveType?.isFloater)
  const optionalHolidays = optionalHolidaysData?.holidays ?? []
  const isSingleDay = startDate.length > 0 && startDate === endDate
  const canUseHalfDay = !isFloater && Boolean(selectedLeaveType?.allowHalfDay) && isSingleDay

  // Switching leave types clears whatever date/half-day state the other mode
  // left behind, so a floater date picked earlier can't leak into a normal
  // date-range request (or vice versa) after the employee changes their mind.
  useEffect(() => {
    setValue('startDate', '')
    setValue('endDate', '')
    setValue('isHalfDay', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveTypeId])

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
      navigate('/leave', { replace: true })
    } catch (error) {
      setServerError(errorMessage(error, 'Could not submit the leave request. Please try again.'))
    }
  }

  if (isLeaveTypesPending) {
    return <LoadingState />
  }

  if (isLeaveTypesError) {
    return <p className="text-sm text-error">Could not load leave types. Please try again.</p>
  }

  return (
    <div className="max-w-lg">
      <Link to="/leave" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to my leave
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-ink">Apply for leave</h1>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
        )}
        <FormSelect
          id="leaveTypeId"
          label="Leave type"
          disabled={isSubmitting}
          errorMessage={errors.leaveTypeId?.message}
          {...register('leaveTypeId')}
        >
          <option value="">Select a leave type</option>
          {leaveTypesData.leaveTypes.map((leaveType) => (
            <option key={leaveType.id} value={leaveType.id}>
              {leaveType.name}
            </option>
          ))}
        </FormSelect>
        {selectedBalance && (
          <p className="-mt-2 mb-4 text-sm text-muted">
            Available: <span className="font-medium text-ink">{selectedBalance.availableDays}</span> days
          </p>
        )}
        {isFloater ? (
          <FormSelect
            id="startDate"
            label="Optional holiday date"
            disabled={isSubmitting}
            errorMessage={errors.startDate?.message ?? errors.endDate?.message}
            {...register('startDate', { onChange: (event) => setValue('endDate', event.target.value, { shouldValidate: true }) })}
          >
            <option value="">Select an optional holiday</option>
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
            <label className="mb-4 flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" disabled={isSubmitting || !canUseHalfDay} {...register('isHalfDay')} />
              Half-day{!canUseHalfDay && ' (single-day request only, if the leave type allows it)'}
            </label>
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
            className="w-full rounded-md border border-border px-3 py-2 text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            {...register('reason')}
          />
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          Submit request
        </Button>
      </form>
    </div>
  )
}
