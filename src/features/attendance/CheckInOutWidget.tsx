import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../lib/apiClient'
import { useCheckIn, useCheckOut, useMyMonth } from './hooks'
import {
  formatClockTime,
  formatWorkedMinutes,
  statusClasses,
  statusLabel,
  todayDateKey,
  toMonthKey,
} from './display'
import type { AttendanceStatus } from './types'

// The backend rejects check-in on these with a 409; reflecting them here means
// the user sees why instead of being handed an error they can't act on.
const NON_WORKING_STATUSES: Partial<Record<AttendanceStatus, string>> = {
  WEEK_OFF: 'Today is a week off — no check-in needed.',
  HOLIDAY: 'Today is a company holiday — no check-in needed.',
  ON_LEAVE: 'You are on approved leave today — no check-in needed.',
}

function ElapsedSince({ checkInAt }: { checkInAt: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(checkInAt).getTime()) / 1000))
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  return (
    <span className="font-mono text-2xl font-semibold text-heading tabular-nums">
      {hours}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
}

export function CheckInOutWidget() {
  const month = toMonthKey(new Date())
  const { data, isPending, isError } = useMyMonth(month)
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  if (isPending) {
    return (
      <div className="flex justify-center rounded-md border border-card-border bg-white p-4">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-md border border-card-border bg-white p-4">
        <p className="text-sm text-error">Could not load today's attendance.</p>
      </div>
    )
  }

  const today = data.days.find((day) => day.date === todayDateKey())
  // A month view that somehow doesn't include today (clock skew across the UTC
  // boundary) — better to say nothing than to render a misleading widget.
  if (!today) {
    return (
      <div className="rounded-md border border-card-border bg-white p-4">
        <p className="text-sm text-secondary">No attendance entry for today.</p>
      </div>
    )
  }

  const nonWorkingReason = today.status === null ? undefined : NON_WORKING_STATUSES[today.status]
  const activeMutation = checkOut.isPending || checkOut.isError ? checkOut : checkIn
  const errorMessage = activeMutation.isError
    ? activeMutation.error instanceof ApiError
      ? activeMutation.error.message
      : 'Something went wrong. Please try again.'
    : ''

  return (
    <div className="rounded-md border border-card-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-heading">Today</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(today.status)}`}>
          {statusLabel(today.status)}
        </span>
      </div>

      {nonWorkingReason ? (
        <p className="text-sm text-secondary">{nonWorkingReason}</p>
      ) : today.checkInAt && today.checkOutAt ? (
        <div>
          <p className="text-2xl font-semibold text-heading">{formatWorkedMinutes(today.workedMinutes)}</p>
          <p className="mt-1 text-sm text-secondary">
            In {formatClockTime(today.checkInAt)} · Out {formatClockTime(today.checkOutAt)}
          </p>
        </div>
      ) : today.checkInAt ? (
        <div>
          <ElapsedSince checkInAt={today.checkInAt} />
          <p className="mt-1 mb-3 text-sm text-secondary">Checked in at {formatClockTime(today.checkInAt)}</p>
          <Button className="w-auto" isLoading={checkOut.isPending} onClick={() => checkOut.mutate()}>
            Check out
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-secondary">You haven't checked in yet.</p>
          <Button className="w-auto" isLoading={checkIn.isPending} onClick={() => checkIn.mutate()}>
            Check in
          </Button>
        </div>
      )}

      {errorMessage && <p className="mt-3 text-sm text-error">{errorMessage}</p>}
    </div>
  )
}
