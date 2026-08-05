import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/apiClient'
import { EmployeeForm } from '../../features/employees/EmployeeForm'
import { useCreateEmployee } from '../../features/employees/hooks'
import type { EmployeeFormValues } from '../../features/employees/validation'

export function CreateEmployeePage() {
  const navigate = useNavigate()
  const createEmployee = useCreateEmployee()
  const [serverError, setServerError] = useState('')

  async function handleSubmit(values: EmployeeFormValues) {
    setServerError('')
    try {
      const { employee } = await createEmployee.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        designation: values.designation || undefined,
        managerId: values.managerId || undefined,
      })
      navigate(`/employees/${employee.id}`, { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Could not create the employee. Please try again.')
    }
  }

  return (
    <div className="max-w-lg">
      <Link to="/employees" className="mb-4 inline-block text-sm text-primary-300 hover:underline">
        ← Back to employees
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-heading">Add employee</h1>
      <EmployeeForm submitLabel="Create employee" serverError={serverError} onSubmit={handleSubmit} />
    </div>
  )
}
