import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { FormSelect } from '../../components/ui/FormSelect'
import { Modal } from '../../components/ui/Modal'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useCreateEmployee, useDepartments, useEmployees } from '../../features/employees/hooks'
import { EMPLOYEE_ROLES, type EmployeeRole } from '../../features/employees/types'
import { EmployeeStatusBadge } from '../../features/employees/StatusBadge'
import { formatCalendarDate } from '../../features/employees/display'
import { EmployeeForm } from '../../features/employees/EmployeeForm'
import type { EmployeeFormValues } from '../../features/employees/validation'
import { LoadingState } from '../../components/ui/Spinner'

const PAGE_SIZE = 20

function portalStatusLabel(hasUser: boolean, invitedAt: string | null) {
  if (hasUser) return 'Active'
  if (invitedAt) return 'Invited'
  return 'Not invited'
}

function daysSinceJoined(joiningDate: string | null): string {
  if (!joiningDate) return '—'
  const days = Math.floor((Date.now() - new Date(joiningDate).getTime()) / (1000 * 60 * 60 * 24))
  return `${days} day${days === 1 ? '' : 's'}`
}

export function EmployeesListPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | ''>('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addServerError, setAddServerError] = useState('')
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useEmployees(page, PAGE_SIZE)
  const { data: departmentData } = useDepartments()
  const { canManageEmployees } = useActiveMemberRole()
  const createEmployee = useCreateEmployee()

  async function handleAddEmployee(values: EmployeeFormValues) {
    setAddServerError('')
    try {
      await createEmployee.mutateAsync({
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
      setIsAddOpen(false)
    } catch (error) {
      setAddServerError(errorMessage(error, 'Could not create the employee. Please try again.'))
    }
  }

  // The backend's list endpoint only paginates (no search/role query params),
  // so filtering only ever narrows the currently loaded page.
  const filteredEmployees = useMemo(() => {
    if (!data) return []
    const term = searchTerm.trim().toLowerCase()
    return data.employees.filter((employee) => {
      const matchesTerm = term === '' || employee.fullName.toLowerCase().includes(term) || employee.email.toLowerCase().includes(term)
      const matchesRole = roleFilter === '' || employee.role === roleFilter
      const matchesDepartment = departmentFilter === '' || employee.departmentId === departmentFilter
      const matchesStatus =
        statusFilter === '' || (statusFilter === 'active' ? employee.isActive : !employee.isActive)
      return matchesTerm && matchesRole && matchesDepartment && matchesStatus
    })
  }, [data, searchTerm, roleFilter, departmentFilter, statusFilter])

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-muted">You don't have access to the employee directory.</p>
    }
    return <p className="text-sm text-error">Could not load employees. Please try again.</p>
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Employees</h1>
        {canManageEmployees && (
          <Button fullWidth={false} onClick={() => setIsAddOpen(true)}>
            Add employee
          </Button>
        )}
      </div>

      {isAddOpen && (
        <Modal title="Add Employee" onClose={() => setIsAddOpen(false)}>
          <EmployeeForm submitLabel="Create" serverError={addServerError} onSubmit={handleAddEmployee} />
        </Modal>
      )}

      {data.total === 0 ? (
        <p className="text-sm text-muted">No employees yet.</p>
      ) : (
        <>
          <div className="mb-4 flex gap-4">
            <div className="w-64">
              <label htmlFor="employeeSearch" className="mb-1 block text-sm font-medium text-ink-2">
                Search
              </label>
              <input
                id="employeeSearch"
                type="search"
                placeholder="Name or email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <FormSelect
              id="roleFilter"
              label="Role"
              className="w-40"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as EmployeeRole | '')}
            >
              <option value="">All roles</option>
              {EMPLOYEE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              id="departmentFilter"
              label="Department"
              className="w-48"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="">All departments</option>
              {(departmentData?.departments ?? []).map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              id="statusFilter"
              label="Status"
              className="w-36"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'active' | 'inactive' | '')}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </div>

          {filteredEmployees.length === 0 ? (
            <p className="text-sm text-muted">No employees match your search.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1200px] text-left text-sm [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2.5">
                <thead>
                  <tr className="border-b border-border bg-neutral text-xs text-ink-2">
                    <th className="font-medium">Name</th>
                    <th className="font-medium">Email</th>
                    <th className="font-medium">Role</th>
                    <th className="font-medium">Department</th>
                    <th className="font-medium">Designation</th>
                    <th className="font-medium">Reporting Person</th>
                    <th className="font-medium">Date of joining</th>
                    <th className="font-medium">Days since joining</th>
                    <th className="font-medium">Date of leaving</th>
                    <th className="font-medium">Status</th>
                    <th className="font-medium">Portal access</th>
                  </tr>
                </thead>
                <tbody className="bg-panel">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => navigate(`/employees/${employee.id}`)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-row-hover"
                    >
                      <td>
                        <Link to={`/employees/${employee.id}`} className="text-primary hover:underline" onClick={(event) => event.stopPropagation()}>
                          {employee.fullName}
                        </Link>
                      </td>
                      <td className="text-ink-2">{employee.email}</td>
                      <td className="text-ink-2">{employee.role}</td>
                      <td className="text-ink-2">{employee.department?.name ?? '—'}</td>
                      <td className="text-ink-2">{employee.designation ?? '—'}</td>
                      <td className="text-ink-2">{employee.manager?.fullName ?? '—'}</td>
                      <td className="text-ink-2">{formatCalendarDate(employee.joiningDate)}</td>
                      <td className="text-ink-2">{daysSinceJoined(employee.joiningDate)}</td>
                      <td className="text-ink-2">{formatCalendarDate(employee.leavingDate)}</td>
                      <td>
                        <EmployeeStatusBadge isActive={employee.isActive} />
                      </td>
                      <td className="text-ink-2">{portalStatusLabel(employee.userId !== null, employee.invitedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              Page {data.page} of {totalPages} ({data.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth={false}
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
