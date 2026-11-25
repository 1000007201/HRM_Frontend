import { useEffect, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { errorMessage } from '../../lib/apiClient'
import { authClient } from '../../lib/auth-client'
import { useAttendanceSettings, useCheckIn, useCheckOut, useMyMonth } from './hooks'
import { formatClockTime, formatWorkedMinutes, todayDateKey, toMonthKey } from './display'
import type { AttendanceStatus } from './types'
import { Spinner } from '../../components/ui/Spinner'

const NON_WORKING_STATUSES: Partial<Record<AttendanceStatus, string>> = {
  WEEK_OFF: 'Today is a week off — no check-in needed.',
  HOLIDAY: 'Today is a company holiday — no check-in needed.',
  ON_LEAVE: 'You are on approved leave today — no check-in needed.',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(fullName: string | undefined): string {
  if (!fullName) return ''
  return fullName.split(/\s+/)[0]
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="text-right">
      <p className="font-mono text-sm font-medium tabular-nums text-ink">{time}</p>
      <p className="text-xs text-muted">{date}</p>
    </div>
  )
}

function ElapsedTimer({ checkInAt, expectedMinutes }: { checkInAt: string; expectedMinutes: number | null }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(checkInAt).getTime()) / 1000))
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const progressPercent = expectedMinutes && expectedMinutes > 0
    ? Math.min(100, Math.round((elapsedMinutes / expectedMinutes) * 100))
    : null

  return (
    <div>
      <p className="font-mono text-3xl font-bold tabular-nums text-ink">
        {hours}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
      {progressPercent !== null && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>{formatWorkedMinutes(elapsedMinutes)}</span>
            <span>{formatWorkedMinutes(expectedMinutes!)}</span>
          </div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

type TodayState = 'not-working' | 'not-checked-in' | 'working' | 'done'

function statusPill(state: TodayState, nonWorkingReason?: string): { label: string; classes: string } {
  switch (state) {
    case 'not-working':
      return { label: nonWorkingReason ? 'Off' : 'Off', classes: 'bg-neutral text-neutral-ink' }
    case 'not-checked-in':
      return { label: 'Not marked', classes: 'bg-white text-muted border border-border' }
    case 'working':
      return { label: 'Working', classes: 'bg-success-bg text-success' }
    case 'done':
      return { label: 'Done', classes: 'bg-success-bg text-success' }
  }
}

export function CheckInOutWidget() {
  const month = toMonthKey(new Date())
  const { data, isPending, isError } = useMyMonth(month)
  const { data: settingsData } = useAttendanceSettings()
  const { data: session } = authClient.useSession()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  if (isPending) {
    return (
      <div className="flex justify-center rounded-2xl border border-border bg-white p-5">
        <Spinner size="sm" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-error">Could not load today's attendance.</p>
      </div>
    )
  }

  const today = data.days.find((day) => day.date === todayDateKey())
  if (!today) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">No attendance entry for today.</p>
      </div>
    )
  }

  const nonWorkingReason = today.status === null ? undefined : NON_WORKING_STATUSES[today.status]
  const activeMutation = checkOut.isPending || checkOut.isError ? checkOut : checkIn
  const punchError = activeMutation.isError
    ? errorMessage(activeMutation.error, 'Something went wrong. Please try again.')
    : ''

  const expectedMinutes = settingsData?.settings?.fullDayMinutes ?? null

  let state: TodayState
  if (nonWorkingReason) state = 'not-working'
  else if (today.checkInAt && today.checkOutAt) state = 'done'
  else if (today.checkInAt) state = 'working'
  else state = 'not-checked-in'

  const pill = statusPill(state, nonWorkingReason)
  const firstName = getFirstName(session?.user?.name)

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-2">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${pill.classes}`}>
            {pill.label}
          </span>
        </div>
        <LiveClock />
      </div>

      {state === 'not-working' && (
        <p className="text-sm text-muted">{nonWorkingReason}</p>
      )}

      {state === 'not-checked-in' && (
        <div>
          <p className="mb-3 text-sm text-muted">You haven't checked in yet.</p>
          <Button fullWidth={false} isLoading={checkIn.isPending} onClick={() => checkIn.mutate()}>
            <LogIn className="mr-1.5 h-4 w-4" />
            Check in
          </Button>
        </div>
      )}

      {state === 'working' && (
        <div>
          <ElapsedTimer checkInAt={today.checkInAt!} expectedMinutes={expectedMinutes} />
          <p className="mt-1.5 text-sm text-muted">
            Checked in at {formatClockTime(today.checkInAt)}
          </p>
          <Button fullWidth={false} isLoading={checkOut.isPending} onClick={() => checkOut.mutate()} className="mt-3">
            <LogOut className="mr-1.5 h-4 w-4" />
            Check out
          </Button>
        </div>
      )}

      {state === 'done' && (
        <div>
          <p className="text-2xl font-bold text-ink">{formatWorkedMinutes(today.workedMinutes)}</p>
          <p className="mt-1 text-sm text-muted">
            {formatClockTime(today.checkInAt)} → {formatClockTime(today.checkOutAt)}
          </p>
        </div>
      )}

      {punchError && <p className="mt-3 text-sm text-error">{punchError}</p>}
    </div>
  )
}
