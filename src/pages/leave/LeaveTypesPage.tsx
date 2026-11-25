import { zodResolver } from '@hookform/resolvers/zod'
import { MoreHorizontal, Pencil, Plus, Power } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import {
  useAllLeaveTypes,
  useCreateLeaveType,
  useToggleLeaveTypeActive,
  useUpdateFloaterQuota,
  useUpdateLeaveType,
} from '../../features/leave/hooks'
import type { LeaveType } from '../../features/leave/types'
import { leaveTypeFormSchema, type LeaveTypeFormValues } from '../../features/leave/validation'

function allocationLabel(leaveType: LeaveType): string {
  if (leaveType.allocationType === 'ANNUAL_GRANT') return 'Annual grant'
  return Number(leaveType.accrualPerMonth) >= leaveType.annualCap ? 'All at once' : 'Monthly'
}

function accrualFrequency(leaveType: LeaveType): 'ANNUAL' | 'MONTHLY' {
  if (Number(leaveType.accrualPerMonth) >= leaveType.annualCap) return 'ANNUAL'
  return 'MONTHLY'
}

function RowActions({
  leaveType,
  onEdit,
}: {
  leaveType: LeaveType
  onEdit: (leaveType: LeaveType) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleActive = useToggleLeaveTypeActive()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-md p-1 text-muted hover:bg-row-hover hover:text-ink-2"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-border bg-white py-1 shadow-sm">
          {!leaveType.isFloater && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onEdit(leaveType)
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink-2 hover:bg-row-hover"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {!leaveType.isFloater && (
            <button
              type="button"
              disabled={toggleActive.isPending}
              onClick={() => {
                toggleActive.mutate(leaveType.id, { onSettled: () => setIsOpen(false) })
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink-2 hover:bg-row-hover disabled:opacity-50"
            >
              <Power className="h-3.5 w-3.5" />
              {leaveType.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LeaveTypeFormModal({
  leaveType,
  onClose,
}: {
  leaveType?: LeaveType
  onClose: () => void
}) {
  const isEdit = Boolean(leaveType)
  const createLeaveType = useCreateLeaveType()
  const updateLeaveType = useUpdateLeaveType()
  const updateFloaterQuota = useUpdateFloaterQuota()
  const [serverError, setServerError] = useState('')

  const isFloaterEdit = isEdit && leaveType?.isFloater

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeFormSchema),
    defaultValues: leaveType
      ? {
          name: leaveType.name,
          code: leaveType.code,
          annualCap: leaveType.annualCap,
          accrualFrequency: accrualFrequency(leaveType),
          isPaid: leaveType.isPaid,
          allowHalfDay: leaveType.allowHalfDay,
        }
      : { name: '', code: '', annualCap: 12, accrualFrequency: 'ANNUAL', isPaid: true, allowHalfDay: true },
  })

  async function handleFormSubmit(values: LeaveTypeFormValues) {
    setServerError('')
    try {
      if (isFloaterEdit) {
        await updateFloaterQuota.mutateAsync(values.annualCap)
      } else if (isEdit && leaveType) {
        await updateLeaveType.mutateAsync({
          id: leaveType.id,
          input: {
            name: values.name,
            annualCap: values.annualCap,
            accrualFrequency: values.accrualFrequency,
            isPaid: values.isPaid,
            allowHalfDay: values.allowHalfDay,
          },
        })
      } else {
        await createLeaveType.mutateAsync(values)
      }
      onClose()
    } catch (error) {
      setServerError(errorMessage(error, `Could not ${isEdit ? 'update' : 'add'} the leave type.`))
    }
  }

  return (
    <Modal title={isEdit ? 'Edit leave type' : 'Add leave type'} onClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {serverError && (
          <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
            {serverError}
          </p>
        )}
        <FormInput
          id="leaveTypeName"
          label="Name"
          placeholder="Casual leave"
          disabled={isSubmitting || isFloaterEdit}
          errorMessage={errors.name?.message}
          {...register('name')}
        />
        <FormInput
          id="leaveTypeCode"
          label="Code"
          placeholder="CL"
          className="uppercase"
          disabled={isSubmitting || isEdit}
          errorMessage={errors.code?.message}
          {...register('code')}
        />
        <FormInput
          id="leaveTypeAnnualCap"
          label="Number of leaves"
          type="number"
          min={1}
          max={365}
          disabled={isSubmitting}
          errorMessage={errors.annualCap?.message}
          {...register('annualCap', { valueAsNumber: true })}
        />

        {!isFloaterEdit && (
          <>
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
          </>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Add leave type'}
        </Button>
      </form>
    </Modal>
  )
}

export function LeaveTypesPage() {
  const { canManageEmployees: canManage } = useActiveMemberRole()
  const { data, isPending, isError, error } = useAllLeaveTypes()
  const [modalLeaveType, setModalLeaveType] = useState<LeaveType | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openAdd() {
    setModalLeaveType(undefined)
    setIsModalOpen(true)
  }

  function openEdit(leaveType: LeaveType) {
    setModalLeaveType(leaveType)
    setIsModalOpen(true)
  }

  if (!canManage) {
    return (
      <div>
        <h1 className="mb-6 text-lg font-semibold text-ink">Leave types</h1>
        <p className="text-sm text-muted">You don't have access to manage leave types.</p>
      </div>
    )
  }

  const leaveTypes = data?.leaveTypes ?? []
  const activeCount = leaveTypes.filter((lt) => lt.isActive).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Leave types</h1>
          {!isPending && !isError && (
            <p className="mt-0.5 text-sm text-muted">
              {activeCount} active · {leaveTypes.length} total
            </p>
          )}
        </div>
        <Button fullWidth={false} onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add leave type
        </Button>
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <p className="text-sm text-error">{errorMessage(error, 'Could not load leave types.')}</p>
      ) : leaveTypes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No leave types yet — add your first one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2.5">
            <thead>
              <tr className="border-b border-border bg-neutral text-xs text-ink-2">
                <th className="font-medium">Leave type</th>
                <th className="font-medium">Quota</th>
                <th className="font-medium">Allocation</th>
                <th className="font-medium">Paid</th>
                <th className="font-medium">Half-day</th>
                <th className="font-medium">Status</th>
                <th className="w-10 font-medium" />
              </tr>
            </thead>
            <tbody className="bg-panel">
              {leaveTypes.map((leaveType) => (
                <tr
                  key={leaveType.id}
                  className={`border-b border-border last:border-0 hover:bg-row-hover ${!leaveType.isActive ? 'opacity-50' : ''}`}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{leaveType.name}</span>
                      <span className="rounded bg-neutral px-1.5 py-0.5 text-xs font-medium text-neutral-ink">
                        {leaveType.code}
                      </span>
                      {leaveType.isFloater && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-primary">
                          Floater
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-ink-2">{leaveType.annualCap} days/yr</td>
                  <td className="text-ink-2">{allocationLabel(leaveType)}</td>
                  <td className="text-ink-2">{leaveType.isPaid ? 'Yes' : 'No'}</td>
                  <td className="text-ink-2">{leaveType.allowHalfDay ? 'Yes' : 'No'}</td>
                  <td>
                    {leaveType.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral px-2 py-0.5 text-xs font-medium text-muted">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <RowActions leaveType={leaveType} onEdit={openEdit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <LeaveTypeFormModal leaveType={modalLeaveType} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
