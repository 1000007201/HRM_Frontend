import type { AttendanceStatus, Regularization } from './types'

// THE one place attendance status -> colour/label lives. Calendar cells,
// badges, legends and the HR table all read from here so they cannot drift
// apart. Colours are design tokens only (see CLAUDE.md): PRESENT success,
// HALF_DAY warning, ABSENT error, ON_LEAVE onLeave, HOLIDAY/WEEK_OFF neutral.
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  HALF_DAY: 'Half day',
  ABSENT: 'Absent',
  ON_LEAVE: 'On leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week off',
}

const ATTENDANCE_STATUS_CLASSES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success-bg text-success',
  HALF_DAY: 'bg-warning-bg text-warning',
  ABSENT: 'bg-error-bg text-error',
  ON_LEAVE: 'bg-on-leave-bg text-on-leave',
  HOLIDAY: 'bg-neutral text-neutral-ink',
  WEEK_OFF: 'bg-neutral text-neutral-ink',
}

// null = the backend hasn't determined the day yet (today/future, no record).
const UNDETERMINED_CLASSES = 'bg-white text-muted'

export const statusClasses = (status: AttendanceStatus | null): string =>
  status === null ? UNDETERMINED_CLASSES : ATTENDANCE_STATUS_CLASSES[status]

export const statusLabel = (status: AttendanceStatus | null): string =>
  status === null ? 'Not marked' : ATTENDANCE_STATUS_LABELS[status]

export const formatWorkedMinutes = (workedMinutes: number | null): string => {
  if (workedMinutes === null) return '—'
  return `${Math.floor(workedMinutes / 60)}h ${String(workedMinutes % 60).padStart(2, '0')}m`
}

// checkInAt/checkOutAt are real instants (timestamps), not calendar dates, so
// they format in the viewer's LOCAL zone — unlike `date`, which is a UTC
// calendar day and must be formatted with timeZone: 'UTC'.
export const formatClockTime = (instant: string | null): string =>
  instant === null ? '—' : new Date(instant).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

// One human-readable line for whatever a regularization is asking to change —
// the three "requested" fields are each independently optional, and a request
// carries at least one of them.
export const describeRequestedChange = (
  regularization: Pick<Regularization, 'requestedCheckInAt' | 'requestedCheckOutAt' | 'requestedStatus'>,
): string => {
  const changes: string[] = []
  if (regularization.requestedCheckInAt) changes.push(`in ${formatClockTime(regularization.requestedCheckInAt)}`)
  if (regularization.requestedCheckOutAt) changes.push(`out ${formatClockTime(regularization.requestedCheckOutAt)}`)
  if (regularization.requestedStatus) changes.push(ATTENDANCE_STATUS_LABELS[regularization.requestedStatus])
  return changes.length > 0 ? changes.join(' · ') : '—'
}

const dayLabelFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

export const formatDayLabel = (dateKey: string): string => dayLabelFormatter.format(toUtcDate(dateKey))

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatMonthLabel = (monthKey: string): string => monthLabelFormatter.format(toUtcDate(`${monthKey}-01`))

/** "YYYY-MM-DD" -> the UTC-midnight instant the backend means by that day. */
export const toUtcDate = (dateKey: string): Date => new Date(`${dateKey}T00:00:00.000Z`)

export const toMonthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

export const toDateKey = (date: Date): string => date.toISOString().slice(0, 10)

/** Today as a UTC calendar day key — the same reference the backend derives against. */
export const todayDateKey = (): string => toDateKey(new Date())

// Month arithmetic via Date.UTC, which rolls over correctly at both ends
// (month -1 -> previous December, month 12 -> next January).
export const shiftMonth = (monthKey: string, monthDelta: number): string => {
  const [year, month] = monthKey.split('-').map(Number)
  return toMonthKey(new Date(Date.UTC(year, month - 1 + monthDelta, 1)))
}

/** Weekday index (0 = Sunday) the month's 1st falls on — the calendar's leading blanks. */
export const leadingBlankCount = (monthKey: string): number => toUtcDate(`${monthKey}-01`).getUTCDay()

// Combines a "YYYY-MM-DD" day with a "HH:MM" wall-clock time into an ISO
// instant, interpreting the time in the viewer's LOCAL zone (which is what
// someone typing "09:00" means). Returns undefined for an empty time so
// callers can omit the field entirely.
export const toInstant = (dateKey: string, time: string): string | undefined =>
  time === '' ? undefined : new Date(`${dateKey}T${time}`).toISOString()
