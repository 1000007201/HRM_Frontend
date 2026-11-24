import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormSelect } from '../../components/ui/FormSelect'
import { Modal } from '../../components/ui/Modal'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useCreateEmployee, useDepartments, useEmployees } from '../../features/employees/hooks'
import { inviteEmployee } from '../../features/employees/api'
import { EMPLOYEE_ROLES, type Employee, type EmployeeRole } from '../../features/employees/types'
import { EmployeeStatusBadge } from '../../features/employees/StatusBadge'
import { formatCalendarDate } from '../../features/employees/display'
import { EmployeeForm } from '../../features/employees/EmployeeForm'
import type { EmployeeFormValues } from '../../features/employees/validation'
import { LoadingState } from '../../components/ui/Spinner'

const PAGE_SIZE = 20

// Warm, desaturated palette that sits well with the coffee theme.
const AVATAR_COLORS = [
  'bg-[#C4A882] text-white',
  'bg-[#8A9BA8] text-white',
  'bg-[#A8886F] text-white',
  'bg-[#7D9B8F] text-white',
  'bg-[#B0908A] text-white',
  'bg-[#9A8BB0] text-white',
  'bg-[#8FA8A0] text-white',
  'bg-[#B8A07A] text-white',
]

function avatarColorClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function yearsSinceJoined(joiningDate: string | null): string | null {
  if (!joiningDate) return null
  const diffMs = Date.now() - new Date(joiningDate).getTime()
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25))
  if (years < 1) {
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
    return months < 1 ? 'New' : `${months} mo`
  }
  return `${years} yr${years === 1 ? '' : 's'}`
}

function PortalAccessIndicator({ employee }: { employee: Employee }) {
  if (employee.userId !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="text-success">Active</span>
      </span>
    )
  }
  if (employee.invitedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-accent">Invited</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-muted" />
      <span className="text-muted">No access</span>
    </span>
  )
}

function RoleChip({ role }: { role: EmployeeRole }) {
  const label = role.charAt(0) + role.slice(1).toLowerCase()
  if (role === 'ADMIN') {
    return (
      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-neutral px-2 py-0.5 text-xs font-medium text-neutral-ink">
      {label}
    </span>
  )
}

function MiniAvatar({ name }: { name: string }) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold leading-none ${avatarColorClass(name)}`}
    >
      {getInitials(name)}
    </span>
  )
}

function RowActionsMenu({
  employee,
  canManage,
  onInvite,
}: {
  employee: Employee
  canManage: boolean
  onInvite: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const showInvite = canManage && employee.userId === null && !employee.invitedAt

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className="rounded p-1 text-muted hover:bg-row-hover hover:text-ink-2"
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-lg border border-border bg-panel py-1 shadow-lg">
          <Link
            to={`/employees/${employee.id}`}
            onClick={(event) => event.stopPropagation()}
            className="block px-3 py-1.5 text-sm text-ink-2 hover:bg-row-hover"
          >
            View
          </Link>
          {canManage && (
            <Link
              to={`/employees/${employee.id}/edit`}
              onClick={(event) => event.stopPropagation()}
              className="block px-3 py-1.5 text-sm text-ink-2 hover:bg-row-hover"
            >
              Edit
            </Link>
          )}
          {showInvite && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onInvite(employee.id)
                setOpen(false)
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-ink-2 hover:bg-row-hover"
            >
              Invite to portal
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface ActiveFilter {
  key: string
  label: string
  clear: () => void
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
  const queryClient = useQueryClient()
  const { data, isPending, isError, error } = useEmployees(page, PAGE_SIZE)
  const { data: departmentData } = useDepartments()
  const { canManageEmployees } = useActiveMemberRole()
  const createEmployee = useCreateEmployee()

  const inviteMutation = useMutation({
    mutationFn: (id: string) => inviteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

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

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = []
    if (searchTerm.trim()) {
      filters.push({ key: 'search', label: `Search: "${searchTerm.trim()}"`, clear: () => setSearchTerm('') })
    }
    if (roleFilter) {
      const label = roleFilter.charAt(0) + roleFilter.slice(1).toLowerCase()
      filters.push({ key: 'role', label: `Role: ${label}`, clear: () => setRoleFilter('') })
    }
    if (departmentFilter) {
      const deptName = departmentData?.departments.find((d) => d.id === departmentFilter)?.name ?? departmentFilter
      filters.push({ key: 'dept', label: `Dept: ${deptName}`, clear: () => setDepartmentFilter('') })
    }
    if (statusFilter) {
      filters.push({
        key: 'status',
        label: `Status: ${statusFilter === 'active' ? 'Active' : 'Inactive'}`,
        clear: () => setStatusFilter(''),
      })
    }
    return filters
  }, [searchTerm, roleFilter, departmentFilter, departmentData, statusFilter])

  function clearAllFilters() {
    setSearchTerm('')
    setRoleFilter('')
    setDepartmentFilter('')
    setStatusFilter('')
  }

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
  const rangeStart = (data.page - 1) * data.pageSize + 1
  const rangeEnd = Math.min(data.page * data.pageSize, data.total)

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
          <div className="mb-4 flex flex-wrap gap-4">
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

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-ink-2"
                >
                  {filter.label}
                  <button type="button" onClick={filter.clear} className="ml-0.5 text-muted hover:text-ink">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {activeFilters.length > 1 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {filteredEmployees.length === 0 ? (
            <p className="text-sm text-muted">No employees match your search.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[960px] text-left text-sm [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2.5">
                <thead>
                  <tr className="border-b border-border bg-neutral text-xs text-ink-2">
                    <th className="font-medium">Employee</th>
                    <th className="font-medium">Role</th>
                    <th className="font-medium">Department</th>
                    <th className="font-medium">Designation</th>
                    <th className="font-medium">Reporting to</th>
                    <th className="font-medium">Joined</th>
                    <th className="font-medium">Status</th>
                    <th className="font-medium">Portal access</th>
                    <th className="w-10" />
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
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColorClass(employee.fullName)}`}
                          >
                            {getInitials(employee.fullName)}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/employees/${employee.id}`}
                              className="block truncate font-medium text-ink hover:text-primary"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {employee.fullName}
                            </Link>
                            <p className="truncate text-xs text-muted">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><RoleChip role={employee.role} /></td>
                      <td className="text-ink-2">{employee.department?.name ?? '—'}</td>
                      <td className="text-ink-2">{employee.designation ?? '—'}</td>
                      <td>
                        {employee.manager ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MiniAvatar name={employee.manager.fullName} />
                            <span className="text-ink-2">{employee.manager.fullName}</span>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <span className="text-ink-2">{formatCalendarDate(employee.joiningDate)}</span>
                          {yearsSinceJoined(employee.joiningDate) && (
                            <p className="text-xs text-muted">{yearsSinceJoined(employee.joiningDate)}</p>
                          )}
                        </div>
                      </td>
                      <td><EmployeeStatusBadge isActive={employee.isActive} /></td>
                      <td><PortalAccessIndicator employee={employee} /></td>
                      <td>
                        <RowActionsMenu
                          employee={employee}
                          canManage={canManageEmployees}
                          onInvite={(id) => inviteMutation.mutate(id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              Showing {rangeStart}–{rangeEnd} of {data.total}
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
