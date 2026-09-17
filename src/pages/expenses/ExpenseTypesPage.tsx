import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { LoadingState } from '../../components/ui/Spinner'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useCreateExpenseType, useDeleteExpenseType, useExpenseTypes, useUpdateExpenseType } from '../../features/expenses/hooks'
import { expenseTypeFormSchema, type ExpenseTypeFormValues } from '../../features/expenses/validation'
import type { ExpenseType } from '../../features/expenses/types'

function AddExpenseTypeForm() {
  const createExpenseType = useCreateExpenseType()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseTypeFormValues>({
    resolver: zodResolver(expenseTypeFormSchema),
    defaultValues: { name: '' },
  })

  async function handleFormSubmit(values: ExpenseTypeFormValues) {
    setServerError('')
    try {
      await createExpenseType.mutateAsync(values)
      reset()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not add the expense type. Please try again.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="rounded-2xl border border-border bg-canvas p-4">
      <p className="mb-3 text-sm font-medium text-ink">Add an expense type</p>
      {serverError && (
        <p className="mb-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <div className="flex items-start gap-3">
        <div className="w-64">
          <FormInput
            id="expenseTypeName"
            label="Name"
            placeholder="Travel"
            className="bg-white"
            disabled={isSubmitting}
            errorMessage={errors.name?.message}
            {...register('name')}
          />
        </div>
        <Button type="submit" className="mt-6" fullWidth={false} isLoading={isSubmitting}>
          Add
        </Button>
      </div>
    </form>
  )
}

function ExpenseTypeRow({ expenseType }: { expenseType: ExpenseType }) {
  const updateExpenseType = useUpdateExpenseType()
  const deleteExpenseType = useDeleteExpenseType()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(expenseType.name)
  const [rowError, setRowError] = useState('')

  function cancelEdit() {
    setIsEditing(false)
    setName(expenseType.name)
  }

  async function handleRename() {
    const trimmed = name.trim()
    if (trimmed === '' || trimmed === expenseType.name) {
      cancelEdit()
      return
    }
    setRowError('')
    try {
      await updateExpenseType.mutateAsync({ id: expenseType.id, input: { name: trimmed } })
      setIsEditing(false)
    } catch (error) {
      setRowError(errorMessage(error, 'Could not rename the expense type.'))
    }
  }

  async function handleToggleActive() {
    setRowError('')
    try {
      await updateExpenseType.mutateAsync({ id: expenseType.id, input: { isActive: !expenseType.isActive } })
    } catch (error) {
      setRowError(errorMessage(error, 'Could not update the expense type.'))
    }
  }

  async function handleDelete() {
    setRowError('')
    try {
      await deleteExpenseType.mutateAsync(expenseType.id)
    } catch (error) {
      // The backend refuses to delete an expense type still referenced by an
      // expense request (409) — deactivate it instead of deleting.
      if (error instanceof ApiError && error.status === 409) {
        setRowError('This expense type is used by one or more expense requests and can’t be deleted. Deactivate it instead.')
      } else {
        setRowError(errorMessage(error, 'Could not delete the expense type.'))
      }
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border bg-white px-4 py-2">
      <div className="flex items-center gap-3">
        {isEditing ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleRename()
              if (event.key === 'Escape') cancelEdit()
            }}
            className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        ) : (
          <span className={`flex-1 text-sm font-medium ${expenseType.isActive ? 'text-ink' : 'text-muted line-through'}`}>
            {expenseType.name}
          </span>
        )}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            expenseType.isActive ? 'bg-success-bg text-success' : 'bg-neutral text-neutral-ink'
          }`}
        >
          {expenseType.isActive ? 'Active' : 'Inactive'}
        </span>
        {isEditing ? (
          <>
            <Button fullWidth={false} isLoading={updateExpenseType.isPending} onClick={handleRename}>
              Save
            </Button>
            <Button variant="secondary" fullWidth={false} onClick={cancelEdit}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="shrink-0 rounded-md p-1.5 text-ink-2 hover:bg-row-hover"
              aria-label={`Rename ${expenseType.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <Button variant="secondary" fullWidth={false} isLoading={updateExpenseType.isPending} onClick={handleToggleActive}>
              {expenseType.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteExpenseType.isPending}
              className="shrink-0 rounded-md p-1.5 text-error hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Delete ${expenseType.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {rowError && <p className="text-xs text-error">{rowError}</p>}
    </li>
  )
}

function ExpenseTypeManagement() {
  const { data, isPending, isError, error } = useExpenseTypes()

  return (
    <>
      <div className="mb-6">
        <AddExpenseTypeForm />
      </div>
      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <p className="text-sm text-error">{errorMessage(error, 'Could not load expense types. Please try again.')}</p>
      ) : data.expenseTypes.length === 0 ? (
        <p className="text-sm text-muted">No expense types yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.expenseTypes.map((expenseType) => (
            <ExpenseTypeRow key={expenseType.id} expenseType={expenseType} />
          ))}
        </ul>
      )}
    </>
  )
}

export function ExpenseTypesPage() {
  const { canManageEmployees: isAdmin, isLoading } = useActiveMemberRole()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Expense types</h1>
      {isLoading ? (
        <LoadingState />
      ) : isAdmin ? (
        <ExpenseTypeManagement />
      ) : (
        <p className="text-sm text-muted">You don't have access to manage expense types.</p>
      )}
    </div>
  )
}
