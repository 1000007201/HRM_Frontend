import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Pencil, Search } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useMarkAttendance, useOrgDay } from '../../features/attendance/hooks'
import {
  ATTENDANCE_STATUS_LABELS,
  formatClockTime,
  formatWorkedMinutes,
  statusClasses,
  statusLabel,
  todayDateKey,
  toInstant,
} from '../../features/attendance/display'
import { MARKABLE_ATTENDANCE_STATUSES, type AttendanceStatus, type OrgDayEntry } from '../../features/attendance/types'
import { markAttendanceFormSchema, type MarkAttendanceFormValues } from '../../features/attendance/validation'
import { LoadingState } from '../../components/ui/Spinner'

type StatusFilter = AttendanceStatus | 'NOT_MARKED'

const AVATAR_COLORS = [
  'bg-[#D4A574] text-white',
  'bg-[#A67B5B] text-white',
  'bg-[#C4956A] text-white',
  'bg-[#8B6F5E] text-white',
  'bg-[#B8926A] text-white',
  'bg-[#9E7B65] text-white',
  'bg-[#C9A882] text-white',
  'bg-[#7D6B5D] text-white',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColorClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function shiftDay(dateKey: string, delta: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

const dateLabelFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

interface SummaryCounts {
  PRESENT: number
  HALF_DAY: number
  ABSENT: number
  ON_LEAVE: number
  HOLIDAY_WEEKOFF: number
  NOT_MARKED: number
}

function computeSummary(entries: OrgDayEntry[]): SummaryCounts {
  const counts: SummaryCounts = { PRESENT: 0, HALF_DAY: 0, ABSENT: 0, ON_LEAVE: 0, HOLIDAY_WEEKOFF: 0, NOT_MARKED: 0 }
  for (const entry of entries) {
    const status = entry.day.status
    if (status === null) counts.NOT_MARKED++
    else if (status === 'PRESENT') counts.PRESENT++
    else if (status === 'HALF_DAY') counts.HALF_DAY++
    else if (status === 'ABSENT') counts.ABSENT++
    else if (status === 'ON_LEAVE') counts.ON_LEAVE++
    else counts.HOLIDAY_WEEKOFF++
  }
  return counts
}

const SUMMARY_CHIPS: { key: keyof SummaryCounts; label: string; filterValue: StatusFilter | null; classes: string }[] = [
  { key: 'PRESENT', label: 'Present', filterValue: 'PRESENT', classes: 'bg-success-bg text-success border-success/20' },
  { key: 'HALF_DAY', label: 'Half day', filterValue: 'HALF_DAY', classes: 'bg-warning-bg text-warning border-warning/20' },
  { key: 'ABSENT', label: 'Absent', filterValue: 'ABSENT', classes: 'bg-error-bg text-error border-error/20' },
  { key: 'ON_LEAVE', label: 'On leave', filterValue: 'ON_LEAVE', classes: 'bg-on-leave-bg text-on-leave border-on-leave/20' },
  { key: 'HOLIDAY_WEEKOFF', label: 'Holiday / Week off', filterValue: null, classes: 'bg-neutral text-neutral-ink border-border' },
  { key: 'NOT_MARKED', label: 'Not marked', filterValue: 'NOT_MARKED', classes: 'bg-white text-muted border-border' },
]

function SummaryBar({
  counts,
  activeFilter,
  onToggle,
}: {
  counts: SummaryCounts
  activeFilter: StatusFilter | null
  onToggle: (filter: StatusFilter | null) => void
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {SUMMARY_CHIPS.map((chip) => {
        const count = counts[chip.key]
        const isActive =
          chip.filterValue !== null && activeFilter === chip.filterValue
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => {
              if (chip.filterValue === null) return
              onToggle(isActive ? null : chip.filterValue)
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${chip.classes} ${
              isActive ? 'ring-2 ring-accent/30' : ''
            } ${chip.filterValue === null ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="text-lg font-bold leading-none">{count}</span>
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

function MarkAttendanceForm({ entry, dateKey, onDone }: { entry: OrgDayEntry; dateKey: string; onDone: () => void }) {
  const markAttendance = useMarkAttendance()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarkAttendanceFormValues>({
    resolver: zodResolver(markAttendanceFormSchema),
    defaultValues: { status: '', checkInTime: '', checkOutTime: '', note: '' },
  })

  async function handleFormSubmit(values: MarkAttendanceFormValues) {
    setServerError('')
    try {
      await markAttendance.mutateAsync({
        employeeId: entry.employee.id,
        date: dateKey,
        status: values.status === '' ? undefined : values.status,
        checkInAt: toInstant(dateKey, values.checkInTime),
        checkOutAt: toInstant(dateKey, values.checkOutTime),
        note: values.note.trim() || undefined,
      })
      onDone()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not save. Please try again.'))
    }
  }

  return (
    <tr className="border-b border-border bg-canvas">
      <td colSpan={6} className="px-3 py-3">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <p className="mb-2 text-sm font-medium text-ink">Mark / correct — {entry.employee.fullName}</p>
          {serverError && (
            <p className="mb-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <FormSelect
              id={`status-${entry.employee.id}`}
              label="Status"
              className="bg-white"
              disabled={isSubmitting}
              errorMessage={errors.status?.message}
              {...register('status')}
            >
              <option value="">Leave unchanged</option>
              {MARKABLE_ATTENDANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ATTENDANCE_STATUS_LABELS[status]}
                </option>
              ))}
            </FormSelect>
            <FormInput
              id={`checkIn-${entry.employee.id}`}
              label="Check in"
              type="time"
              className="bg-white"
              disabled={isSubmitting}
              {...register('checkInTime')}
            />
            <FormInput
              id={`checkOut-${entry.employee.id}`}
              label="Check out"
              type="time"
              className="bg-white"
              disabled={isSubmitting}
              {...register('checkOutTime')}
            />
            <FormInput
              id={`note-${entry.employee.id}`}
              label="Note (optional)"
              className="bg-white"
              disabled={isSubmitting}
              {...register('note')}
            />
            <Button type="submit" className="mt-6" fullWidth={false} isLoading={isSubmitting}>
              Save
            </Button>
            <Button type="button" variant="secondary" className="mt-6" fullWidth={false} onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </tr>
  )
}

export function HrDayViewPage() {
  const [dateKey, setDateKey] = useState(todayDateKey)
  const [markingEmployeeId, setMarkingEmployeeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null)
  const { data, isPending, isError, error } = useOrgDay(dateKey)

  const entries = data?.attendance ?? []
  const summary = useMemo(() => computeSummary(entries), [entries])

  const filteredEntries = useMemo(() => {
    let result = entries
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((entry) => entry.employee.fullName.toLowerCase().includes(query))
    }
    if (statusFilter) {
      result = result.filter((entry) => {
        if (statusFilter === 'NOT_MARKED') return entry.day.status === null
        return entry.day.status === statusFilter
      })
    }
    return result
  }, [entries, searchQuery, statusFilter])

  const isToday = dateKey === todayDateKey()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Attendance — day view</h1>
          <p className="mt-0.5 text-sm text-muted">
            {dateLabelFormatter.format(new Date(`${dateKey}T00:00:00.000Z`))}
            {!isPending && !isError && ` · ${entries.length} employees`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDateKey(shiftDay(dateKey, -1))}
            className="rounded-md p-1.5 text-muted hover:bg-row-hover hover:text-ink-2"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            id="dayViewDate"
            type="date"
            value={dateKey}
            onChange={(event) => {
              if (event.target.value) setDateKey(event.target.value)
            }}
            className="rounded-md border border-border bg-white px-2.5 py-1 text-sm text-ink-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="button"
            onClick={() => setDateKey(shiftDay(dateKey, 1))}
            className="rounded-md p-1.5 text-muted hover:bg-row-hover hover:text-ink-2"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDateKey(todayDateKey())}
              className="ml-1 rounded-md border border-border bg-white px-2.5 py-1 text-sm font-medium text-primary hover:bg-row-hover"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <p className="text-sm text-error">
          {error instanceof ApiError && error.status === 403
            ? "You don't have access to the org day view."
            : errorMessage(error, 'Could not load attendance for this date.')}
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">No employees to show for this date.</p>
      ) : (
        <>
          <SummaryBar counts={summary} activeFilter={statusFilter} onToggle={setStatusFilter} />

          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-md border border-border bg-white py-1 pl-8 pr-3 text-sm text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            {(searchQuery || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter(null)
                }}
                className="text-xs font-medium text-primary hover:text-primary-hover"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No employees match the current filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2.5">
                <thead>
                  <tr className="border-b border-border bg-neutral text-xs text-ink-2">
                    <th className="font-medium">Employee</th>
                    <th className="font-medium">Status</th>
                    <th className="font-medium">In</th>
                    <th className="font-medium">Out</th>
                    <th className="font-medium">Worked</th>
                    <th className="w-10 font-medium" />
                  </tr>
                </thead>
                <tbody className="bg-panel">
                  {filteredEntries.map((entry) => (
                    <Fragment key={entry.employee.id}>
                      <tr className="group border-b border-border last:border-0 hover:bg-row-hover">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${avatarColorClass(entry.employee.fullName)}`}
                            >
                              {getInitials(entry.employee.fullName)}
                            </span>
                            <span className="font-medium text-ink">{entry.employee.fullName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(entry.day.status)}`}>
                            {statusLabel(entry.day.status)}
                          </span>
                        </td>
                        <td className="text-ink-2">{formatClockTime(entry.day.checkInAt)}</td>
                        <td className="text-ink-2">{formatClockTime(entry.day.checkOutAt)}</td>
                        <td className="text-ink-2">{formatWorkedMinutes(entry.day.workedMinutes)}</td>
                        <td className="text-right">
                          {markingEmployeeId !== entry.employee.id && (
                            <button
                              type="button"
                              onClick={() => setMarkingEmployeeId(entry.employee.id)}
                              className="rounded-md p-1 text-muted opacity-0 transition-opacity hover:bg-canvas hover:text-primary group-hover:opacity-100"
                              aria-label={`Mark / correct ${entry.employee.fullName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {markingEmployeeId === entry.employee.id && (
                        <MarkAttendanceForm entry={entry} dateKey={dateKey} onDone={() => setMarkingEmployeeId(null)} />
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            Showing {filteredEntries.length} of {entries.length} employees
          </p>
        </>
      )}
    </div>
  )
}
