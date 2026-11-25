import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil, Power, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from '../../features/employees/hooks'
import { departmentFormSchema, type DepartmentFormValues } from '../../features/employees/validation'
import type { Department } from '../../features/employees/types'
import { LoadingState } from '../../components/ui/Spinner'

function AddDepartmentBar() {
  const createDepartment = useCreateDepartment()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: '' },
  })

  async function handleFormSubmit(values: DepartmentFormValues) {
    setServerError('')
    try {
      await createDepartment.mutateAsync(values)
      reset()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not add the department. Please try again.'))
    }
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-center gap-2">
        <Plus className="h-4 w-4 shrink-0 text-muted" />
        <input
          placeholder="New department name"
          disabled={isSubmitting}
          {...register('name')}
          className="w-64 rounded-md border border-border bg-panel px-3 py-1.5 text-sm text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
          Add
        </Button>
      </form>
      {errors.name && <p className="mt-1 pl-6 text-xs text-error">{errors.name.message}</p>}
      {serverError && <p className="mt-1 pl-6 text-xs text-error">{serverError}</p>}
    </div>
  )
}

function DepartmentCard({ department }: { department: Department }) {
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(department.name)
  const [cardError, setCardError] = useState('')

  function cancelEdit() {
    setIsEditing(false)
    setName(department.name)
  }

  async function handleRename() {
    const trimmed = name.trim()
    if (trimmed === '' || trimmed === department.name) {
      cancelEdit()
      return
    }
    setCardError('')
    try {
      await updateDepartment.mutateAsync({ id: department.id, input: { name: trimmed } })
      setIsEditing(false)
    } catch (error) {
      setCardError(errorMessage(error, 'Could not rename the department.'))
    }
  }

  async function handleToggleActive() {
    setCardError('')
    try {
      await updateDepartment.mutateAsync({ id: department.id, input: { isActive: !department.isActive } })
    } catch (error) {
      setCardError(errorMessage(error, 'Could not update the department.'))
    }
  }

  async function handleDelete() {
    setCardError('')
    try {
      await deleteDepartment.mutateAsync(department.id)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setCardError('Assigned to employees — deactivate instead.')
      } else {
        setCardError(errorMessage(error, 'Could not delete the department.'))
      }
    }
  }

  const initial = department.name.charAt(0).toUpperCase()

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-panel p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleRename()
                  if (event.key === 'Escape') cancelEdit()
                }}
                className="w-full rounded-md border border-border px-2 py-1 text-sm text-ink-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <div className="flex gap-2">
                <Button fullWidth={false} isLoading={updateDepartment.isPending} onClick={handleRename} className="!py-1 !px-2 !text-xs">
                  Save
                </Button>
                <button type="button" onClick={cancelEdit} className="text-xs text-muted hover:text-ink-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-sm font-semibold leading-tight ${department.isActive ? 'text-ink' : 'text-muted line-through'}`}>
                {department.name}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  department.isActive ? 'bg-success-bg text-success' : 'bg-neutral text-neutral-ink'
                }`}
              >
                {department.isActive ? 'Active' : 'Inactive'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mb-3">
        <span className={`text-2xl font-bold leading-none ${department.employeeCount > 0 ? 'text-ink' : 'text-muted'}`}>
          {department.employeeCount}
        </span>
        <p className="mt-0.5 text-xs text-muted">
          employee{department.employeeCount === 1 ? '' : 's'}
        </p>
      </div>

      {cardError && <p className="mb-2 text-xs text-error">{cardError}</p>}

      {!isEditing && (
        <div className="mt-auto flex items-center gap-1 border-t border-border pt-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title="Rename"
            className="rounded p-1.5 text-muted hover:bg-row-hover hover:text-ink-2"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={updateDepartment.isPending}
            title={department.isActive ? 'Deactivate' : 'Activate'}
            className="rounded p-1.5 text-muted hover:bg-row-hover hover:text-ink-2 disabled:opacity-50"
          >
            <Power className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteDepartment.isPending}
            title="Delete"
            className="rounded p-1.5 text-muted hover:bg-error/10 hover:text-error disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export function DepartmentsPage() {
  const { data, isPending, isError, error } = useDepartments()

  const totalEmployees = data?.departments.reduce((sum, d) => sum + d.employeeCount, 0) ?? 0

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-ink">Departments</h1>
      {data && (
        <p className="mb-6 text-sm text-muted">
          {data.departments.length} department{data.departments.length === 1 ? '' : 's'} &middot; {totalEmployees} employee{totalEmployees === 1 ? '' : 's'}
        </p>
      )}

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        error instanceof ApiError && error.status === 403 ? (
          <p className="text-sm text-muted">You don't have access to manage departments.</p>
        ) : (
          <p className="text-sm text-error">Could not load departments. Please try again.</p>
        )
      ) : (
        <>
          <AddDepartmentBar />
          {data.departments.length === 0 ? (
            <p className="text-sm text-muted">No departments yet. Add one above.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {data.departments.map((department) => (
                <DepartmentCard key={department.id} department={department} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
