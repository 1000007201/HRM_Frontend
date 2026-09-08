import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from '../../features/employees/hooks'
import { departmentFormSchema, type DepartmentFormValues } from '../../features/employees/validation'
import type { Department } from '../../features/employees/types'
import { LoadingState } from '../../components/ui/Spinner'

function AddDepartmentForm() {
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="rounded-2xl border border-border bg-canvas p-4">
      <p className="mb-3 text-sm font-medium text-ink">Add a department</p>
      {serverError && (
        <p className="mb-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <div className="flex items-start gap-3">
        <div className="w-64">
          <FormInput
            id="departmentName"
            label="Name"
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

function DepartmentRow({ department }: { department: Department }) {
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(department.name)
  const [rowError, setRowError] = useState('')

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
    setRowError('')
    try {
      await updateDepartment.mutateAsync({ id: department.id, input: { name: trimmed } })
      setIsEditing(false)
    } catch (error) {
      setRowError(errorMessage(error, 'Could not rename the department.'))
    }
  }

  async function handleToggleActive() {
    setRowError('')
    try {
      await updateDepartment.mutateAsync({ id: department.id, input: { isActive: !department.isActive } })
    } catch (error) {
      setRowError(errorMessage(error, 'Could not update the department.'))
    }
  }

  async function handleDelete() {
    setRowError('')
    try {
      await deleteDepartment.mutateAsync(department.id)
    } catch (error) {
      // The backend refuses to delete a department still assigned to
      // employees (409) — reassign or deactivate it instead of deleting.
      if (error instanceof ApiError && error.status === 409) {
        setRowError('This department is assigned to one or more employees and can’t be deleted. Deactivate it instead.')
      } else {
        setRowError(errorMessage(error, 'Could not delete the department.'))
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
          <span className={`flex-1 text-sm font-medium ${department.isActive ? 'text-ink' : 'text-muted line-through'}`}>
            {department.name}
          </span>
        )}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            department.isActive ? 'bg-success-bg text-success' : 'bg-neutral text-neutral-ink'
          }`}
        >
          {department.isActive ? 'Active' : 'Inactive'}
        </span>
        {isEditing ? (
          <>
            <Button fullWidth={false} isLoading={updateDepartment.isPending} onClick={handleRename}>
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
              aria-label={`Rename ${department.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <Button variant="secondary" fullWidth={false} isLoading={updateDepartment.isPending} onClick={handleToggleActive}>
              {department.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteDepartment.isPending}
              className="shrink-0 rounded-md p-1.5 text-error hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Delete ${department.name}`}
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

export function DepartmentsPage() {
  const { data, isPending, isError, error } = useDepartments()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Departments</h1>
      <div className="mb-6">
        <AddDepartmentForm />
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        error instanceof ApiError && error.status === 403 ? (
          <p className="text-sm text-muted">You don't have access to manage departments.</p>
        ) : (
          <p className="text-sm text-error">Could not load departments. Please try again.</p>
        )
      ) : data.departments.length === 0 ? (
        <p className="text-sm text-muted">No departments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.departments.map((department) => (
            <DepartmentRow key={department.id} department={department} />
          ))}
        </ul>
      )}
    </div>
  )
}
