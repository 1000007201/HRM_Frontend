import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { FormSelect } from '../../components/auth/FormSelect'
import { ApiError } from '../../lib/apiClient'
import { useCreateLeaveRequest, useLeaveTypes, useMyLeaveBalances } from '../../features/leave/hooks'
import { applyLeaveFormSchema, type ApplyLeaveFormValues } from '../../features/leave/validation'

export function ApplyLeavePage() {
  const navigate = useNavigate()
  const { data: leaveTypesData, isPending: isLeaveTypesPending, isError: isLeaveTypesError } = useLeaveTypes()
  const { data: balancesData } = useMyLeaveBalances()
  const createLeaveRequest = useCreateLeaveRequest()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
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
  const isSingleDay = startDate.length > 0 && startDate === endDate
  const canUseHalfDay = Boolean(selectedLeaveType?.allowHalfDay) && isSingleDay

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
      setServerError(error instanceof ApiError ? error.message : 'Could not submit the leave request. Please try again.')
    }
  }

  if (isLeaveTypesPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isLeaveTypesError) {
    return <p className="text-sm text-error">Could not load leave types. Please try again.</p>
  }

  return (
    <div className="max-w-lg">
      <Link to="/leave" className="mb-4 inline-block text-sm text-primary-300 hover:underline">
        ← Back to my leave
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-heading">Apply for leave</h1>
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
          <p className="-mt-2 mb-4 text-sm text-secondary">
            Available: <span className="font-medium text-heading">{selectedBalance.availableDays}</span> days
          </p>
        )}
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
        <label className="mb-4 flex items-center gap-2 text-sm text-body">
          <input type="checkbox" disabled={isSubmitting || !canUseHalfDay} {...register('isHalfDay')} />
          Half-day{!canUseHalfDay && ' (single-day request only, if the leave type allows it)'}
        </label>
        {errors.isHalfDay && <p className="-mt-3 mb-4 text-sm text-error">{errors.isHalfDay.message}</p>}
        <div className="mb-4">
          <label htmlFor="reason" className="mb-1 block text-sm font-medium text-body">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-md border border-charcoal-100 px-3 py-2 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300"
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
