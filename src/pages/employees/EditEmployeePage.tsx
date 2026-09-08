import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { errorMessage } from '../../lib/apiClient'
import { EmployeeForm } from '../../features/employees/EmployeeForm'
import { useEmployee, useUpdateEmployee } from '../../features/employees/hooks'
import type { EmployeeFormValues } from '../../features/employees/validation'
import { LoadingState } from '../../components/ui/Spinner'

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError } = useEmployee(id!)
  const updateEmployee = useUpdateEmployee(id!)
  const [serverError, setServerError] = useState('')

  if (isPending) {
    return <LoadingState />
  }

  if (isError || !data) {
    return <p className="text-sm text-error">Could not load this employee.</p>
  }

  const { employee } = data

  async function handleSubmit(values: EmployeeFormValues) {
    setServerError('')
    try {
      await updateEmployee.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        designation: values.designation || null,
        managerId: values.managerId || null,
        departmentId: values.departmentId || null,
        joiningDate: values.joiningDate || null,
        leavingDate: values.leavingDate || null,
        employeeCode: values.employeeCode || null,
        phone: values.phone || null,
        dateOfBirth: values.dateOfBirth || null,
        gender: values.gender || null,
        address: values.address || null,
        emergencyContactName: values.emergencyContactName || null,
        emergencyContactPhone: values.emergencyContactPhone || null,
      })
      navigate(`/employees/${id}`, { replace: true })
    } catch (error) {
      setServerError(errorMessage(error, 'Could not save changes. Please try again.'))
    }
  }

  if (!id) return <Navigate to="/employees" replace />

  return (
    <div className="max-w-lg">
      <Link to={`/employees/${id}`} className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to employee
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-ink">Edit employee</h1>
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
          departmentId: employee.departmentId ?? '',
          joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : '',
          leavingDate: employee.leavingDate ? employee.leavingDate.slice(0, 10) : '',
          employeeCode: employee.employeeCode ?? '',
          phone: employee.phone ?? '',
          dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : '',
          gender: employee.gender ?? '',
          address: employee.address ?? '',
          emergencyContactName: employee.emergencyContactName ?? '',
          emergencyContactPhone: employee.emergencyContactPhone ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
