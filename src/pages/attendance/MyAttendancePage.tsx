import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { CheckInOutWidget } from '../../features/attendance/CheckInOutWidget'
import { errorMessage } from '../../lib/apiClient'
import { useMyMonth } from '../../features/attendance/hooks'
import {
  ATTENDANCE_STATUS_LABELS,
  formatClockTime,
  formatDayLabel,
  formatMonthLabel,
  formatWorkedMinutes,
  leadingBlankCount,
  shiftMonth,
  statusLabel,
  todayDateKey,
  toMonthKey,
  toUtcDate,
} from '../../features/attendance/display'
import { ATTENDANCE_STATUSES, type AttendanceStatus, type DerivedDay } from '../../features/attendance/types'
import { MyRegularizationsList } from '../../features/attendance/MyRegularizationsList'
import { RegularizationForm } from '../../features/attendance/RegularizationForm'
import { LoadingState } from '../../components/ui/Spinner'

const WEEKDAY_HEADINGS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const canRegularize = (day: DerivedDay): boolean =>
  day.date <= todayDateKey() && day.status !== 'WEEK_OFF' && day.status !== 'HOLIDAY'

// Soft tint backgrounds + colored left accent bar — attractive but calm.
const CELL_CLASSES: Record<AttendanceStatus, string> = {
  PRESENT: 'border-l-success bg-success-bg/50 text-success',
  HALF_DAY: 'border-l-warning bg-warning-bg/50 text-warning',
  ABSENT: 'border-l-error/40 bg-error-bg/40 text-error/80',
  ON_LEAVE: 'border-l-on-leave bg-on-leave-bg/50 text-on-leave',
  HOLIDAY: 'border-l-[#9B8EC4] bg-[#F0EDF8] text-[#6B5FA0]',
  WEEK_OFF: 'border-l-border bg-neutral/50 text-muted',
}
const CELL_NULL = 'border-l-transparent bg-white text-muted'

function cellClasses(status: AttendanceStatus | null): string {
  return status === null ? CELL_NULL : CELL_CLASSES[status]
}

// Badge classes (for the legend and the day detail panel — the full colored badge).
const BADGE_CLASSES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success-bg text-success',
  HALF_DAY: 'bg-warning-bg text-warning',
  ABSENT: 'bg-error-bg text-error',
  ON_LEAVE: 'bg-on-leave-bg text-on-leave',
  HOLIDAY: 'bg-[#F0EDF8] text-[#6B5FA0]',
  WEEK_OFF: 'bg-neutral text-neutral-ink',
}

function badgeClasses(status: AttendanceStatus | null): string {
  return status === null ? 'bg-white text-muted border border-border' : BADGE_CLASSES[status]
}

interface MonthSummary {
  present: number
  absent: number
  onLeave: number
  holidays: number
  totalWorkedMinutes: number
}

function computeMonthSummary(days: DerivedDay[]): MonthSummary {
  const summary: MonthSummary = { present: 0, absent: 0, onLeave: 0, holidays: 0, totalWorkedMinutes: 0 }
  for (const day of days) {
    if (day.status === 'PRESENT') summary.present++
    else if (day.status === 'HALF_DAY') { summary.present++; }
    else if (day.status === 'ABSENT') summary.absent++
    else if (day.status === 'ON_LEAVE') summary.onLeave++
    else if (day.status === 'HOLIDAY' || day.status === 'WEEK_OFF') summary.holidays++
    if (day.workedMinutes !== null) summary.totalWorkedMinutes += day.workedMinutes
  }
  return summary
}

function formatTotalWorked(minutes: number): string {
  if (minutes === 0) return '0h'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

const STAT_CARDS: { key: keyof MonthSummary; label: string; colorClass: string; format?: (value: number) => string }[] = [
  { key: 'present', label: 'Present', colorClass: 'text-success' },
  { key: 'absent', label: 'Absent', colorClass: 'text-error' },
  { key: 'onLeave', label: 'On leave', colorClass: 'text-on-leave' },
  { key: 'holidays', label: 'Holidays', colorClass: 'text-muted' },
  { key: 'totalWorkedMinutes', label: 'Worked', colorClass: 'text-primary', format: formatTotalWorked },
]

function MonthStats({ days }: { days: DerivedDay[] }) {
  const summary = computeMonthSummary(days)
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
      {STAT_CARDS.map((card) => {
        const value = summary[card.key]
        return (
          <div key={card.key} className="rounded-xl border border-border bg-white p-3">
            <p className={`text-2xl font-bold leading-none ${card.colorClass}`}>
              {card.format ? card.format(value) : value}
            </p>
            <p className="mt-1 text-xs text-muted">{card.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ATTENDANCE_STATUSES.map((status) => (
        <span key={status} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_CLASSES[status]}`}>
          {ATTENDANCE_STATUS_LABELS[status]}
        </span>
      ))}
      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
        Not marked
      </span>
    </div>
  )
}

function DayDetail({ day, onClose }: { day: DerivedDay; onClose: () => void }) {
  const [isRegularizing, setIsRegularizing] = useState(false)

  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">{formatDayLabel(day.date)}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses(day.status)}`}>
            {statusLabel(day.status)}
          </span>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>In: {formatClockTime(day.checkInAt)}</span>
            <span>Out: {formatClockTime(day.checkOutAt)}</span>
            <span>Worked: {formatWorkedMinutes(day.workedMinutes)}</span>
          </div>
          {day.note && <p className="mt-1 text-sm text-muted">Note: {day.note}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          {canRegularize(day) && !isRegularizing && (
            <Button variant="secondary" fullWidth={false} onClick={() => setIsRegularizing(true)}>
              Regularize
            </Button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2.5 py-1 text-sm text-muted hover:bg-row-hover hover:text-ink-2"
          >
            Close
          </button>
        </div>
      </div>
      {isRegularizing && <RegularizationForm dateKey={day.date} onDone={() => setIsRegularizing(false)} />}
    </div>
  )
}

function MonthCalendar({ days, month }: { days: DerivedDay[]; month: string }) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const selectedDay = days.find((day) => day.date === selectedDateKey)
  const today = todayDateKey()

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_HEADINGS.map((weekday) => (
          <div key={weekday} className="pb-1 text-center text-xs font-medium text-muted">
            {weekday}
          </div>
        ))}
        {Array.from({ length: leadingBlankCount(month) }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const dateNumber = toUtcDate(day.date).getUTCDate()
          const isSelected = day.date === selectedDateKey
          const isToday = day.date === today
          const showWorked =
            day.workedMinutes !== null &&
            day.workedMinutes > 0 &&
            (day.status === 'PRESENT' || day.status === 'HALF_DAY')

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDateKey(isSelected ? null : day.date)}
              className={`flex min-h-[4.25rem] flex-col items-start rounded-lg border border-l-[3px] p-1.5 text-left transition-colors hover:shadow-sm ${cellClasses(day.status)} ${
                isSelected ? 'ring-2 ring-accent border-primary' : 'border-border'
              }`}
            >
              <span
                className={`text-sm font-semibold ${isToday ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white' : 'text-ink'}`}
              >
                {dateNumber}
              </span>
              {showWorked && (
                <span className="mt-auto text-[10px] font-medium leading-tight text-ink-2">
                  {formatWorkedMinutes(day.workedMinutes)}
                </span>
              )}
              {!showWorked && (
                <span className="mt-auto text-[10px] leading-tight">
                  {statusLabel(day.status)}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selectedDay && <DayDetail day={selectedDay} onClose={() => setSelectedDateKey(null)} />}
    </div>
  )
}

export function MyAttendancePage() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()))
  const { data, isPending, isError, error } = useMyMonth(month)

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">My attendance</h1>

      <div className="mb-8 grid grid-cols-1 items-start gap-4 md:grid-cols-[280px_1fr]">
        <CheckInOutWidget />
        {isPending ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-white p-6">
            <LoadingState size="sm" padding="py-0" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm text-error">{errorMessage(error, 'Could not load month data.')}</p>
          </div>
        ) : (
          <MonthStats days={data.days} />
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            className="rounded-md p-1.5 text-muted hover:bg-row-hover hover:text-ink-2"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-36 text-center text-sm font-medium text-ink">{formatMonthLabel(month)}</span>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            className="rounded-md p-1.5 text-muted hover:bg-row-hover hover:text-ink-2"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {month !== toMonthKey(new Date()) && (
            <button
              type="button"
              onClick={() => setMonth(toMonthKey(new Date()))}
              className="ml-1 rounded-md border border-border bg-white px-2.5 py-1 text-sm font-medium text-primary hover:bg-row-hover"
            >
              This month
            </button>
          )}
        </div>
        <Legend />
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <p className="text-sm text-error">
          {errorMessage(error, 'Could not load your attendance. Please try again.')}
        </p>
      ) : data.days.length === 0 ? (
        <p className="text-sm text-muted">No attendance data for {formatMonthLabel(month)}.</p>
      ) : (
        <MonthCalendar days={data.days} month={month} />
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-ink">My regularizations</h2>
        <MyRegularizationsList />
      </div>
    </div>
  )
}
