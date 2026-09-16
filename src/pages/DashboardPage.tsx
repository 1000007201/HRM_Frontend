import { CheckInOutWidget } from '../features/attendance/CheckInOutWidget'
import { todayDateKey } from '../features/attendance/display'
import { useOrgDay } from '../features/attendance/hooks'
import { useAllEmployees } from '../features/employees/hooks'
import { useHolidays } from '../features/holidays/hooks'
import type { Holiday } from '../features/holidays/types'
import { ApiError, errorMessage } from '../lib/apiClient'
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

function StatCard({
  label,
  value,
  isPending,
  isError,
  error,
}: {
  label: string
  value: number
  isPending: boolean
  isError: boolean
  error: unknown
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      {isPending ? (
        <div className="mt-2">
          <Spinner size="sm" />
        </div>
      ) : isError ? (
        <p className="mt-2 text-sm text-error">{dashboardErrorText(error)}</p>
      ) : (
        <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      )}
    </div>
  )
}

export function DashboardPage() {
  const currentYear = new Date().getUTCFullYear()

  const employees = useAllEmployees()
  const orgDay = useOrgDay(todayDateKey())
  const holidaysThisYear = useHolidays(currentYear)
  const holidaysNextYear = useHolidays(currentYear + 1)

  const activeEmployeeCount = employees.data?.filter((employee) => employee.isActive).length ?? 0
  const inactiveEmployeeCount = employees.data?.filter((employee) => !employee.isActive).length ?? 0
  const newJoineeCount = employees.data?.filter((employee) => isJoinedThisMonth(employee.joiningDate)).length ?? 0
  const onLeaveTodayCount = orgDay.data?.attendance.filter((entry) => entry.day.status === 'ON_LEAVE').length ?? 0

  const holidaysPending = holidaysThisYear.isPending || holidaysNextYear.isPending
  const holidaysError = holidaysThisYear.isError || holidaysNextYear.isError
  const upcomingHolidays = upcomingHolidaysWithin15Days([
    ...(holidaysThisYear.data?.holidays ?? []),
    ...(holidaysNextYear.data?.holidays ?? []),
  ])

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Current employees"
          value={activeEmployeeCount}
          isPending={employees.isPending}
          isError={employees.isError}
          error={employees.error}
        />
        <StatCard
          label="New joinees this month"
          value={newJoineeCount}
          isPending={employees.isPending}
          isError={employees.isError}
          error={employees.error}
        />
        <StatCard
          label="Inactive employees"
          value={inactiveEmployeeCount}
          isPending={employees.isPending}
          isError={employees.isError}
          error={employees.error}
        />
        <StatCard
          label="On leave today"
          value={onLeaveTodayCount}
          isPending={orgDay.isPending}
          isError={orgDay.isError}
          error={orgDay.error}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="max-w-sm">
          <CheckInOutWidget />
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="mb-3 text-sm font-medium text-ink">Upcoming holidays (next 15 days)</p>
          {holidaysPending ? (
            <LoadingState padding="py-4" />
          ) : holidaysError ? (
            <p className="text-sm text-error">Could not load the holiday calendar.</p>
          ) : upcomingHolidays.length === 0 ? (
            <p className="text-sm text-muted">No holidays in the next 15 days.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcomingHolidays.map((holiday) => (
                <li key={holiday.id} className="flex items-center gap-4 rounded-md border border-border px-3 py-2">
                  <span className="w-16 shrink-0 text-sm font-medium text-ink">
                    {dayFormatter.format(new Date(holiday.date))}
                  </span>
                  <span className="w-20 shrink-0 text-sm text-muted">
                    {weekdayFormatter.format(new Date(holiday.date))}
                  </span>
                  <span className="flex-1 text-sm text-ink-2">{holiday.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
