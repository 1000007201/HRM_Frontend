import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useCreateLeaveType, useLeaveTypes } from '../../features/leave/hooks'
import { leaveTypeFormSchema, type LeaveTypeFormValues } from '../../features/leave/validation'
import { LoadingState } from '../../components/ui/Spinner'

function AddLeaveTypeForm() {
  const createLeaveType = useCreateLeaveType()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeFormSchema),
    defaultValues: { name: '', code: '', annualCap: 12, accrualFrequency: 'ANNUAL', isPaid: true, allowHalfDay: true },
  })

  async function handleFormSubmit(values: LeaveTypeFormValues) {
    setServerError('')
    try {
      await createLeaveType.mutateAsync(values)
      reset()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not add the leave type. Please try again.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="rounded-2xl border border-border bg-canvas p-4">
      <p className="mb-3 text-sm font-medium text-ink">Add a leave type</p>
      {serverError && (
        <p className="mb-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-48">
          <FormInput
            id="leaveTypeName"
            label="Name"
            placeholder="Casual leave"
            className="bg-white"
            disabled={isSubmitting}
            errorMessage={errors.name?.message}
            {...register('name')}
          />
        </div>
        <div className="w-36">
          <FormInput
            id="leaveTypeCode"
            label="Code"
            placeholder="CL"
            className="bg-white uppercase"
            disabled={isSubmitting}
            errorMessage={errors.code?.message}
            {...register('code')}
          />
        </div>
        <div className="w-40">
          <FormInput
            id="leaveTypeAnnualCap"
            label="Number of leaves"
            type="number"
            min={1}
            max={365}
            className="bg-white"
            disabled={isSubmitting}
            errorMessage={errors.annualCap?.message}
            {...register('annualCap', { valueAsNumber: true })}
          />
        </div>
        <div className="mb-4">
          <span className="mb-1 block text-sm font-medium text-ink-2">Credited</span>
          <div className="flex items-center gap-4 py-1.5">
            <label className="flex items-center gap-1.5 text-sm text-ink-2">
              <input type="radio" value="ANNUAL" disabled={isSubmitting} {...register('accrualFrequency')} />
              All at once
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink-2">
              <input type="radio" value="MONTHLY" disabled={isSubmitting} {...register('accrualFrequency')} />
              Month wise
            </label>
          </div>
        </div>
        <div className="mb-4">
          <span className="mb-1 block text-sm font-medium text-ink-2">Options</span>
          <div className="flex items-center gap-4 py-1.5">
            <label className="flex items-center gap-1.5 text-sm text-ink-2">
              <input type="checkbox" disabled={isSubmitting} {...register('isPaid')} />
              Paid
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink-2">
              <input type="checkbox" disabled={isSubmitting} {...register('allowHalfDay')} />
              Allow half-day
            </label>
          </div>
        </div>
        <Button type="submit" className="mt-6" fullWidth={false} isLoading={isSubmitting}>
          Add
        </Button>
      </div>
    </form>
  )
}

function LeaveTypeList() {
  const { data, isPending, isError, error } = useLeaveTypes()

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return (
      <p className="text-sm text-error">{errorMessage(error, 'Could not load leave types. Please try again.')}</p>
    )
  }

  if (data.leaveTypes.length === 0) {
    return <p className="text-sm text-muted">No leave types yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.leaveTypes.map((leaveType) => (
        <li
          key={leaveType.id}
          className="flex items-center gap-4 rounded-md border border-border bg-white px-4 py-2"
        >
          <span className="flex-1 text-sm font-medium text-ink">{leaveType.name}</span>
          <span className="w-16 shrink-0 text-sm text-muted">{leaveType.code}</span>
          <span className="w-28 shrink-0 text-sm text-ink-2">{leaveType.annualCap} days/year</span>
          <span className="w-28 shrink-0 text-sm text-ink-2">
            {Number(leaveType.accrualPerMonth) >= leaveType.annualCap ? 'All at once' : 'Month wise'}
          </span>
          {!leaveType.isPaid && (
            <span className="shrink-0 rounded-full bg-neutral px-2 py-0.5 text-xs font-medium text-neutral-ink">
              Unpaid
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function LeaveTypesPage() {
  // Same ADMIN-only gate as Departments/Employees management.
  const { canManageEmployees: canManage } = useActiveMemberRole()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Leave types</h1>

      {canManage ? (
        <>
          <div className="mb-6">
            <AddLeaveTypeForm />
          </div>
          <LeaveTypeList />
        </>
      ) : (
        <p className="text-sm text-muted">You don't have access to manage leave types.</p>
      )}
    </div>
  )
}
