import { Link } from 'react-router-dom'
import { AlertCircle, Calendar, Clock, Plus, Send, UserPlus, Users } from 'lucide-react'
import { todayDateKey } from '../features/attendance/display'
import { useOrgDay } from '../features/attendance/hooks'
import { usePendingRegularizations } from '../features/attendance/hooks'
import { useAllEmployees, useDepartments } from '../features/employees/hooks'
import { useHolidays } from '../features/holidays/hooks'
import { usePendingLeaveRequests, useMyLeaveBalances, useMyLeaveRequests } from '../features/leave/hooks'
import { usePendingAdminExpenses } from '../features/expenses/hooks'
import type { Holiday } from '../features/holidays/types'
import { ApiError, errorMessage } from '../lib/apiClient'
import { useActiveMemberRole } from '../lib/useActiveMemberRole'
import { LoadingState, Spinner } from '../components/ui/Spinner'

const dayFormatter = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', timeZone: 'UTC' })
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })

function dashboardErrorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return 'No access'
  return errorMessage(error, 'Could not load.')
}

function isJoinedThisMonth(joiningDate: string | null): boolean {
  if (!joiningDate) return false
  const joined = new Date(joiningDate)
  const now = new Date()
  return joined.getUTCFullYear() === now.getUTCFullYear() && joined.getUTCMonth() === now.getUTCMonth()
}

function upcomingHolidaysWithin15Days(holidays: Holiday[]): Holiday[] {
  const now = new Date()
  const todayUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const windowEnd = todayUtcMidnight + 15 * 24 * 60 * 60 * 1000
  return holidays
    .filter((holiday) => {
      const time = new Date(holiday.date).getTime()
      return time >= todayUtcMidnight && time <= windowEnd
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const AVATAR_COLORS = [
  'bg-[#D4A574]', 'bg-[#A67B5B]', 'bg-[#C4956A]', 'bg-[#8B6F5E]',
  'bg-[#B8926A]', 'bg-[#9E7B65]', 'bg-[#C9A882]', 'bg-[#7D6B5D]',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarBg(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// --- Shared widgets ---

function KpiCard({
  label,
  value,
  icon: Icon,
  to,
  colorClass,
  isPending,
  isError,
  error,
}: {
  label: string
  value: number
  icon: typeof Users
  to: string
  colorClass: string
  isPending: boolean
  isError: boolean
  error: unknown
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-white p-4 transition-colors hover:shadow-sm hover:border-accent/30"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          {isPending ? (
            <Spinner size="sm" />
          ) : isError ? (
            <p className="text-xs text-error">{dashboardErrorText(error)}</p>
          ) : (
            <p className="text-2xl font-bold leading-none text-ink">{value}</p>
          )}
          <p className="mt-0.5 text-xs text-muted">{label}</p>
        </div>
      </div>
    </Link>
  )
}

function UpcomingHolidays() {
  const currentYear = new Date().getUTCFullYear()
  const thisYear = useHolidays(currentYear)
  const nextYear = useHolidays(currentYear + 1)

  const isPending = thisYear.isPending || nextYear.isPending
  const isError = thisYear.isError || nextYear.isError
  const upcoming = upcomingHolidaysWithin15Days([
    ...(thisYear.data?.holidays ?? []),
    ...(nextYear.data?.holidays ?? []),
  ])

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted" />
        <p className="text-sm font-medium text-ink">Upcoming holidays</p>
      </div>
      {isPending ? (
        <LoadingState padding="py-4" size="sm" />
      ) : isError ? (
        <p className="text-sm text-error">Could not load holidays.</p>
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-muted">No holidays in the next 15 days.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {upcoming.map((holiday) => (
            <li key={holiday.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-row-hover">
              <span className="w-14 shrink-0 text-xs font-medium text-ink">
                {dayFormatter.format(new Date(holiday.date))}
              </span>
              <span className="w-10 shrink-0 text-xs text-muted">
                {weekdayFormatter.format(new Date(holiday.date))}
              </span>
              <span className="flex-1 text-sm text-ink-2">{holiday.name}</span>
              {holiday.isOptional && (
                <span className="rounded bg-neutral px-1.5 py-0.5 text-[10px] font-medium text-neutral-ink">Optional</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// --- Admin-only widgets ---

function NeedsAttention() {
  const pendingLeave = usePendingLeaveRequests()
  const pendingRegularizations = usePendingRegularizations()
  const pendingExpenses = usePendingAdminExpenses()

  const items: { label: string; count: number; to: string; isPending: boolean; isError: boolean }[] = [
    {
      label: 'Leave approvals',
      count: pendingLeave.data?.leaveRequests.length ?? 0,
      to: '/leave/approvals',
      isPending: pendingLeave.isPending,
      isError: pendingLeave.isError,
    },
    {
      label: 'Attendance regularizations',
      count: pendingRegularizations.data?.regularizations.length ?? 0,
      to: '/attendance/approvals',
      isPending: pendingRegularizations.isPending,
      isError: pendingRegularizations.isError,
    },
    {
      label: 'Expense approvals',
      count: pendingExpenses.data?.expenseRequests.length ?? 0,
      to: '/expenses/admin',
      isPending: pendingExpenses.isPending,
      isError: pendingExpenses.isError,
    },
  ]

  const totalPending = items.reduce((sum, item) => sum + item.count, 0)
  const anyPending = items.some((item) => item.isPending)

  return { items, totalPending, anyPending }
}

function NeedsAttentionCard() {
  const { items } = NeedsAttention()

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-warning" />
        <p className="text-sm font-medium text-ink">Needs your attention</p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-row-hover"
          >
            <span className="text-sm text-ink-2">{item.label}</span>
            {item.isPending ? (
              <Spinner size="sm" />
            ) : item.isError ? (
              <span className="text-xs text-error">Error</span>
            ) : item.count > 0 ? (
              <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-bold text-warning">
                {item.count}
              </span>
            ) : (
              <span className="text-xs text-muted">0</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

function OnLeaveToday() {
  const orgDay = useOrgDay(todayDateKey())

  const onLeave = (orgDay.data?.attendance ?? []).filter((entry) => entry.day.status === 'ON_LEAVE')

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-on-leave" />
        <p className="text-sm font-medium text-ink">On leave today</p>
      </div>
      {orgDay.isPending ? (
        <LoadingState padding="py-4" size="sm" />
      ) : orgDay.isError ? (
        <p className="text-sm text-error">{dashboardErrorText(orgDay.error)}</p>
      ) : onLeave.length === 0 ? (
        <p className="text-sm text-muted">Nobody is on leave today.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {onLeave.slice(0, 8).map((entry) => (
            <div key={entry.employee.id} className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white ${avatarBg(entry.employee.fullName)}`}
              >
                {getInitials(entry.employee.fullName)}
              </span>
              <span className="text-sm text-ink-2">{entry.employee.fullName}</span>
            </div>
          ))}
          {onLeave.length > 8 && (
            <p className="text-xs text-muted">+{onLeave.length - 8} more</p>
          )}
        </div>
      )}
    </div>
  )
}

function TodayAttendanceSnapshot() {
  const orgDay = useOrgDay(todayDateKey())
  const entries = orgDay.data?.attendance ?? []

  const present = entries.filter((e) => e.day.status === 'PRESENT' || e.day.status === 'HALF_DAY').length
  const absent = entries.filter((e) => e.day.status === 'ABSENT').length
  const notMarked = entries.filter((e) => e.day.status === null).length
  const total = entries.length

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted" />
        <p className="text-sm font-medium text-ink">Today's attendance</p>
      </div>
      {orgDay.isPending ? (
        <LoadingState padding="py-4" size="sm" />
      ) : orgDay.isError ? (
        <p className="text-sm text-error">{dashboardErrorText(orgDay.error)}</p>
      ) : total === 0 ? (
        <p className="text-sm text-muted">No employees.</p>
      ) : (
        <div>
          <div className="mb-3 flex h-3 overflow-hidden rounded-full">
            {present > 0 && (
              <div className="bg-success" style={{ width: `${(present / total) * 100}%` }} />
            )}
            {absent > 0 && (
              <div className="bg-error/70" style={{ width: `${(absent / total) * 100}%` }} />
            )}
            {notMarked > 0 && (
              <div className="bg-border" style={{ width: `${(notMarked / total) * 100}%` }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-ink-2">Present {present}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-error/70" />
              <span className="text-ink-2">Absent {absent}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="text-ink-2">Not marked {notMarked}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function DepartmentHeadcount() {
  const departments = useDepartments()

  const sorted = [...(departments.data?.departments ?? [])]
    .filter((d) => d.isActive)
    .sort((a, b) => b.employeeCount - a.employeeCount)

  const maxCount = sorted.length > 0 ? sorted[0].employeeCount : 1

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-muted" />
        <p className="text-sm font-medium text-ink">Headcount by department</p>
      </div>
      {departments.isPending ? (
        <LoadingState padding="py-4" size="sm" />
      ) : departments.isError ? (
        <p className="text-sm text-error">{dashboardErrorText(departments.error)}</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted">No departments yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((dept) => (
            <div key={dept.id}>
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-xs text-ink-2">{dept.name}</span>
                <span className="text-xs font-medium text-ink">{dept.employeeCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${maxCount > 0 ? (dept.employeeCount / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="mb-3 text-sm font-medium text-ink">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/employees/new"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-row-hover"
        >
          <UserPlus className="h-4 w-4" />
          Add employee
        </Link>
        <Link
          to="/invitations"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-row-hover"
        >
          <Send className="h-4 w-4" />
          Invitations
        </Link>
        <Link
          to="/leave/types"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-row-hover"
        >
          <Plus className="h-4 w-4" />
          Leave types
        </Link>
      </div>
    </div>
  )
}

// --- Employee-only widgets ---

function MyLeaveBalances() {
  const { data, isPending, isError } = useMyLeaveBalances()

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">My leave balances</p>
        <Link to="/leave" className="text-xs font-medium text-primary hover:text-primary-hover">View all</Link>
      </div>
      {isPending ? (
        <LoadingState padding="py-4" size="sm" />
      ) : isError ? (
        <p className="text-sm text-error">Could not load balances.</p>
      ) : !data || data.balances.length === 0 ? (
        <p className="text-sm text-muted">No leave types configured.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
          {data.balances.map((balance) => {
            const available = parseFloat(balance.availableDays)
            return (
              <div key={balance.leaveTypeId} className="rounded-lg border border-border p-2.5">
                <p className={`text-xl font-bold leading-none ${available > 0 ? 'text-primary' : 'text-muted'}`}>
                  {balance.availableDays}
                </p>
                <p className="mt-1 text-[10px] text-muted">{balance.name}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MyPendingRequests() {
  const { data, isPending, isError } = useMyLeaveRequests('PENDING')

  const count = data?.leaveRequests.length ?? 0

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">My pending requests</p>
        <Link to="/leave" className="text-xs font-medium text-primary hover:text-primary-hover">View all</Link>
      </div>
      {isPending ? (
        <LoadingState padding="py-4" size="sm" />
      ) : isError ? (
        <p className="text-sm text-error">Could not load requests.</p>
      ) : count === 0 ? (
        <p className="text-sm text-muted">No pending leave requests.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {data!.leaveRequests.slice(0, 5).map((request) => (
            <div key={request.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-row-hover">
              <span className="text-sm text-ink-2">{request.leaveType.name}</span>
              <span className="text-xs text-muted">
                {new Date(request.startDate).toLocaleDateString(undefined, { timeZone: 'UTC', day: '2-digit', month: 'short' })}
                {request.startDate !== request.endDate && ` – ${new Date(request.endDate).toLocaleDateString(undefined, { timeZone: 'UTC', day: '2-digit', month: 'short' })}`}
              </span>
            </div>
          ))}
          {count > 5 && <p className="text-xs text-muted">+{count - 5} more</p>}
        </div>
      )}
    </div>
  )
}

// --- Admin Dashboard ---

function AdminDashboard() {
  const employees = useAllEmployees()
  const orgDay = useOrgDay(todayDateKey())
  const { totalPending, anyPending: attentionPending } = NeedsAttention()

  const activeEmployeeCount = employees.data?.filter((e) => e.isActive).length ?? 0
  const newJoineeCount = employees.data?.filter((e) => isJoinedThisMonth(e.joiningDate)).length ?? 0
  const onLeaveTodayCount = (orgDay.data?.attendance ?? []).filter((e) => e.day.status === 'ON_LEAVE').length

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Current employees"
          value={activeEmployeeCount}
          icon={Users}
          to="/employees"
          colorClass="bg-primary/10 text-primary"
          isPending={employees.isPending}
          isError={employees.isError}
          error={employees.error}
        />
        <KpiCard
          label="New this month"
          value={newJoineeCount}
          icon={UserPlus}
          to="/employees"
          colorClass="bg-success-bg text-success"
          isPending={employees.isPending}
          isError={employees.isError}
          error={employees.error}
        />
        <KpiCard
          label="On leave today"
          value={onLeaveTodayCount}
          icon={Calendar}
          to="/attendance/day"
          colorClass="bg-on-leave-bg text-on-leave"
          isPending={orgDay.isPending}
          isError={orgDay.isError}
          error={orgDay.error}
        />
        <KpiCard
          label="Pending approvals"
          value={totalPending}
          icon={AlertCircle}
          to="/leave/approvals"
          colorClass="bg-warning-bg text-warning"
          isPending={attentionPending}
          isError={false}
          error={null}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <NeedsAttentionCard />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TodayAttendanceSnapshot />
            <OnLeaveToday />
          </div>
          <QuickActions />
        </div>
        <div className="flex flex-col gap-4">
          <UpcomingHolidays />
          <DepartmentHeadcount />
        </div>
      </div>
    </>
  )
}

// --- Employee Dashboard ---

function EmployeeDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <MyLeaveBalances />
          <MyPendingRequests />
        </div>
        <div className="flex flex-col gap-4">
          <UpcomingHolidays />
        </div>
      </div>
    </>
  )
}

// --- Page ---

export function DashboardPage() {
  const { canManageEmployees: isAdmin, isLoading: isRoleLoading } = useActiveMemberRole()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Dashboard</h1>
      {isRoleLoading ? (
        <LoadingState />
      ) : isAdmin ? (
        <AdminDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  )
}
