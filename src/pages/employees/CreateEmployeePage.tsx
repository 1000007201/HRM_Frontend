import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../lib/apiClient'
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
        departmentId: values.departmentId || undefined,
        joiningDate: values.joiningDate || undefined,
        leavingDate: values.leavingDate || undefined,
        employeeCode: values.employeeCode || undefined,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender || undefined,
        address: values.address || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
      })
      navigate(`/employees/${employee.id}`, { replace: true })
    } catch (error) {
      setServerError(errorMessage(error, 'Could not create the employee. Please try again.'))
    }
  }

  return (
    <div className="max-w-lg">
      <Link to="/employees" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to employees
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-ink">Add employee</h1>
      <EmployeeForm submitLabel="Create employee" serverError={serverError} onSubmit={handleSubmit} />
    </div>
  )
}
