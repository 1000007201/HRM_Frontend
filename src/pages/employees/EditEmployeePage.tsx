import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../lib/apiClient'
import { EmployeeForm } from '../../features/employees/EmployeeForm'
import { useEmployee, useUpdateEmployee } from '../../features/employees/hooks'
import type { EmployeeFormValues } from '../../features/employees/validation'

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError } = useEmployee(id!)
  const updateEmployee = useUpdateEmployee(id!)
  const [serverError, setServerError] = useState('')

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-sm text-error">Could not load this employee.</p>
  }

  const { employee } = data

  // The backend only ever assigns ADMIN at company registration and its own
  // update endpoint rejects role: "ADMIN" — so this form (which only offers
  // HR/MANAGER/EMPLOYEE) can't represent the owner's record. Out of scope here.
  if (employee.role === 'ADMIN') {
    return (
      <div>
        <Link to={`/employees/${employee.id}`} className="mb-4 inline-block text-sm text-primary-300 hover:underline">
          ← Back to employee
        </Link>
        <p className="text-sm text-body">The organization owner's record can't be edited here.</p>
      </div>
    )
  }

  async function handleSubmit(values: EmployeeFormValues) {
    setServerError('')
    try {
      await updateEmployee.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        designation: values.designation || null,
        managerId: values.managerId || null,
      })
      navigate(`/employees/${id}`, { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Could not save changes. Please try again.')
    }
  }

  if (!id) return <Navigate to="/employees" replace />

  return (
    <div className="max-w-lg">
      <Link to={`/employees/${id}`} className="mb-4 inline-block text-sm text-primary-300 hover:underline">
        ← Back to employee
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-heading">Edit employee</h1>
      <EmployeeForm
        submitLabel="Save changes"
        serverError={serverError}
        excludeEmployeeId={id}
        defaultValues={{
          fullName: employee.fullName,
          email: employee.email,
          role: employee.role,
          designation: employee.designation ?? '',
          managerId: employee.managerId ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
