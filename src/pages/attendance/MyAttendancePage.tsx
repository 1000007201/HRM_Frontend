import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { CheckInOutWidget } from '../../features/attendance/CheckInOutWidget'
import { ApiError } from '../../lib/apiClient'
import { useMyMonth } from '../../features/attendance/hooks'
import {
  ATTENDANCE_STATUS_LABELS,
  formatClockTime,
  formatDayLabel,
  formatMonthLabel,
  formatWorkedMinutes,
  leadingBlankCount,
  shiftMonth,
  statusClasses,
  statusLabel,
  todayDateKey,
  toMonthKey,
  toUtcDate,
} from '../../features/attendance/display'
import { ATTENDANCE_STATUSES, type DerivedDay } from '../../features/attendance/types'
import { MyRegularizationsList } from '../../features/attendance/MyRegularizationsList'
import { RegularizationForm } from '../../features/attendance/RegularizationForm'

const WEEKDAY_HEADINGS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// The backend refuses to regularize a week off or a holiday (nothing to
// correct), and a future date hasn't happened yet — mirror that instead of
// offering an action that always errors.
const canRegularize = (day: DerivedDay): boolean =>
  day.date <= todayDateKey() && day.status !== 'WEEK_OFF' && day.status !== 'HOLIDAY'

function Legend() {
  return (
    <div className="flex flex-wrap gap-2">
      {ATTENDANCE_STATUSES.map((status) => (
        <span key={status} className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(status)}`}>
          {ATTENDANCE_STATUS_LABELS[status]}
        </span>
      ))}
      <span className={`rounded-full border border-card-border px-2 py-0.5 text-xs font-medium ${statusClasses(null)}`}>
        Not marked
      </span>
    </div>
  )
}

function DayDetail({ day, onClose }: { day: DerivedDay; onClose: () => void }) {
  const [isRegularizing, setIsRegularizing] = useState(false)

  return (
    <div className="mt-4 rounded-md border border-card-border bg-charcoal-50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-heading">{formatDayLabel(day.date)}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(day.status)}`}>
            {statusLabel(day.status)}
          </span>
          <p className="mt-2 text-sm text-secondary">
            In {formatClockTime(day.checkInAt)} · Out {formatClockTime(day.checkOutAt)} ·{' '}
            {formatWorkedMinutes(day.workedMinutes)}
          </p>
          {day.note && <p className="mt-1 text-sm text-secondary">Note: {day.note}</p>}
        </div>
        <div className="flex gap-2">
          {canRegularize(day) && !isRegularizing && (
            <Button variant="secondary" className="w-auto" onClick={() => setIsRegularizing(true)}>
              Regularize
            </Button>
          )}
          <Button variant="secondary" className="w-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      {isRegularizing && <RegularizationForm dateKey={day.date} onDone={() => setIsRegularizing(false)} />}
    </div>
  )
}

function MonthCalendar({ month }: { month: string }) {
  const { data, isPending, isError, error } = useMyMonth(month)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-error">
        {error instanceof ApiError ? error.message : 'Could not load your attendance. Please try again.'}
      </p>
    )
  }

  if (data.days.length === 0) {
    return <p className="text-sm text-secondary">No attendance data for {formatMonthLabel(month)}.</p>
  }

  const selectedDay = data.days.find((day) => day.date === selectedDateKey)

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_HEADINGS.map((weekday) => (
          <div key={weekday} className="pb-1 text-center text-xs font-medium text-secondary">
            {weekday}
          </div>
        ))}
        {Array.from({ length: leadingBlankCount(month) }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {data.days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setSelectedDateKey(day.date === selectedDateKey ? null : day.date)}
            className={`flex min-h-16 flex-col items-start rounded-md border p-2 text-left transition-colors ${statusClasses(day.status)} ${
              day.date === selectedDateKey ? 'border-primary-300 ring-2 ring-primary-100' : 'border-card-border'
            }`}
          >
            <span className="text-sm font-semibold">{toUtcDate(day.date).getUTCDate()}</span>
            <span className="mt-auto text-[10px] leading-tight">{statusLabel(day.status)}</span>
          </button>
        ))}
      </div>
      {selectedDay && <DayDetail day={selectedDay} onClose={() => setSelectedDateKey(null)} />}
    </div>
  )
}

export function MyAttendancePage() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()))

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-heading">My attendance</h1>

      <div className="mb-8 max-w-sm">
        <CheckInOutWidget />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="w-auto" onClick={() => setMonth((current) => shiftMonth(current, -1))}>
            ←
          </Button>
          <span className="min-w-40 text-center text-sm font-medium text-heading">{formatMonthLabel(month)}</span>
          <Button variant="secondary" className="w-auto" onClick={() => setMonth((current) => shiftMonth(current, 1))}>
            →
          </Button>
        </div>
        <Legend />
      </div>

      <MonthCalendar month={month} />

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-heading">My regularizations</h2>
        <MyRegularizationsList />
      </div>
    </div>
  )
}
