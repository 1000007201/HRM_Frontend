import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/auth/Button'
import { FormInput } from '../../components/auth/FormInput'
import { FormSelect } from '../../components/auth/FormSelect'
import { ApiError } from '../../lib/apiClient'
import { useCreateRegularization } from '../../features/attendance/hooks'
import { ATTENDANCE_STATUS_LABELS, formatDayLabel, toInstant } from '../../features/attendance/display'
import { MARKABLE_ATTENDANCE_STATUSES, REGULARIZATION_TYPES } from '../../features/attendance/types'
import { regularizationFormSchema, type RegularizationFormValues } from '../../features/attendance/validation'

const TYPE_LABELS: Record<(typeof REGULARIZATION_TYPES)[number], string> = {
  MISSING_PUNCH: 'Missing punch',
  WRONG_TIME: 'Wrong time',
  WFH: 'Work from home',
  OTHER: 'Other',
}

export function RegularizationForm({ dateKey, onDone }: { dateKey: string; onDone: () => void }) {
  const createRegularization = useCreateRegularization()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegularizationFormValues>({
    resolver: zodResolver(regularizationFormSchema),
    defaultValues: {
      date: dateKey,
      type: 'MISSING_PUNCH',
      requestedCheckInTime: '',
      requestedCheckOutTime: '',
      requestedStatus: '',
      reason: '',
    },
  })

  async function handleFormSubmit(values: RegularizationFormValues) {
    setServerError('')
    try {
      await createRegularization.mutateAsync({
        date: values.date,
        type: values.type,
        requestedCheckInAt: toInstant(values.date, values.requestedCheckInTime),
        requestedCheckOutAt: toInstant(values.date, values.requestedCheckOutTime),
        requestedStatus: values.requestedStatus === '' ? undefined : values.requestedStatus,
        reason: values.reason,
      })
      onDone()
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Could not submit the regularization. Please try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 rounded-md border border-card-border bg-white p-4">
      <p className="mb-3 text-sm font-medium text-heading">Regularize {formatDayLabel(dateKey)}</p>
      {serverError && (
        <p className="mb-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <input type="hidden" {...register('date')} />

      <FormSelect id="regularizationType" label="Type" disabled={isSubmitting} {...register('type')}>
        {REGULARIZATION_TYPES.map((type) => (
          <option key={type} value={type}>
            {TYPE_LABELS[type]}
          </option>
        ))}
      </FormSelect>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          id="requestedCheckInTime"
          label="Check-in time (optional)"
          type="time"
          disabled={isSubmitting}
          {...register('requestedCheckInTime')}
        />
        <FormInput
          id="requestedCheckOutTime"
          label="Check-out time (optional)"
          type="time"
          disabled={isSubmitting}
          {...register('requestedCheckOutTime')}
        />
      </div>

      <FormSelect
        id="requestedStatus"
        label="Status (optional)"
        disabled={isSubmitting}
        errorMessage={errors.requestedStatus?.message}
        {...register('requestedStatus')}
      >
        <option value="">Leave unchanged</option>
        {MARKABLE_ATTENDANCE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ATTENDANCE_STATUS_LABELS[status]}
          </option>
        ))}
      </FormSelect>

      <div className="mb-4">
        <label htmlFor="reason" className="mb-1 block text-sm font-medium text-body">
          Reason
        </label>
        <textarea
          id="reason"
          rows={3}
          disabled={isSubmitting}
          className="w-full rounded-md border border-charcoal-100 px-3 py-2 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300"
          {...register('reason')}
        />
        {errors.reason && <p className="mt-1 text-sm text-error">{errors.reason.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="w-auto" isLoading={isSubmitting}>
          Submit request
        </Button>
        <Button type="button" variant="secondary" className="w-auto" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
