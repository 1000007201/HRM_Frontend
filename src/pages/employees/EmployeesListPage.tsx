import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/auth/Button'
import { FormSelect } from '../../components/auth/FormSelect'
import { ApiError } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useEmployees } from '../../features/employees/hooks'
import { EMPLOYEE_ROLES, type EmployeeRole } from '../../features/employees/types'

const PAGE_SIZE = 20

function portalStatusLabel(hasUser: boolean, invitedAt: string | null) {
  if (hasUser) return 'Active'
  if (invitedAt) return 'Invited'
  return 'Not invited'
}

export function EmployeesListPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | ''>('')
  const { data, isPending, isError, error } = useEmployees(page, PAGE_SIZE)
  const { canManageEmployees } = useActiveMemberRole()

  // The backend's list endpoint only paginates (no search/role query params),
  // so filtering only ever narrows the currently loaded page.
  const filteredEmployees = useMemo(() => {
    if (!data) return []
    const term = searchTerm.trim().toLowerCase()
    return data.employees.filter((employee) => {
      const matchesTerm = term === '' || employee.fullName.toLowerCase().includes(term) || employee.email.toLowerCase().includes(term)
      const matchesRole = roleFilter === '' || employee.role === roleFilter
      return matchesTerm && matchesRole
    })
  }, [data, searchTerm, roleFilter])

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-secondary">You don't have access to the employee directory.</p>
    }
    return <p className="text-sm text-error">Could not load employees. Please try again.</p>
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-heading">Employees</h1>
        {canManageEmployees && (
          <Link to="/employees/new">
            <Button className="w-auto">Add employee</Button>
          </Link>
        )}
      </div>

      {data.total === 0 ? (
        <p className="text-sm text-secondary">No employees yet.</p>
      ) : (
        <>
          <div className="mb-4 flex gap-4">
            <div className="w-64">
              <label htmlFor="employeeSearch" className="mb-1 block text-sm font-medium text-body">
                Search
              </label>
              <input
                id="employeeSearch"
                type="search"
                placeholder="Name or email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-md border border-charcoal-100 px-3 py-2 text-sm text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300"
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
          </div>

          {filteredEmployees.length === 0 ? (
            <p className="text-sm text-secondary">No employees match your search.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border text-xs text-secondary">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Designation</th>
                  <th className="py-2 font-medium">Manager</th>
                  <th className="py-2 font-medium">Portal access</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-card-border last:border-0">
                    <td className="py-2">
                      <Link to={`/employees/${employee.id}`} className="text-primary-300 hover:underline">
                        {employee.fullName}
                      </Link>
                    </td>
                    <td className="py-2 text-body">{employee.email}</td>
                    <td className="py-2 text-body">{employee.role}</td>
                    <td className="py-2 text-body">{employee.designation ?? '—'}</td>
                    <td className="py-2 text-body">{employee.manager?.fullName ?? '—'}</td>
                    <td className="py-2 text-body">{portalStatusLabel(employee.userId !== null, employee.invitedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-secondary">
            <span>
              Page {data.page} of {totalPages} ({data.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-auto"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                className="w-auto"
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
