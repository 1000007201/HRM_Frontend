import { zodResolver } from '@hookform/resolvers/zod'
import { Fragment, useState } from 'react'
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
import { MARKABLE_ATTENDANCE_STATUSES, type OrgDayEntry } from '../../features/attendance/types'
import { markAttendanceFormSchema, type MarkAttendanceFormValues } from '../../features/attendance/validation'
import { LoadingState } from '../../components/ui/Spinner'

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
    <tr className="border-b border-card-border bg-charcoal-50">
      <td colSpan={5} className="px-3 py-3">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <p className="mb-2 text-sm font-medium text-heading">Mark / correct — {entry.employee.fullName}</p>
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
            <Button type="submit" className="mt-6 w-auto" isLoading={isSubmitting}>
              Save
            </Button>
            <Button type="button" variant="secondary" className="mt-6 w-auto" onClick={onDone}>
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
  const { data, isPending, isError, error } = useOrgDay(dateKey)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-heading">Attendance — day view</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="dayViewDate" className="text-sm text-secondary">
            Date
          </label>
          <input
            id="dayViewDate"
            type="date"
            value={dateKey}
            onChange={(event) => {
              if (event.target.value) setDateKey(event.target.value)
            }}
            className="rounded-md border border-charcoal-100 bg-white px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
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
      ) : data.attendance.length === 0 ? (
        <p className="text-sm text-secondary">No employees to show for this date.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-xs text-secondary">
              <th className="py-2 font-medium">Employee</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">In / Out</th>
              <th className="py-2 font-medium">Worked</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.attendance.map((entry) => (
              <Fragment key={entry.employee.id}>
                <tr className="border-b border-card-border last:border-0">
                  <td className="py-2 text-body">{entry.employee.fullName}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(entry.day.status)}`}>
                      {statusLabel(entry.day.status)}
                    </span>
                  </td>
                  <td className="py-2 text-body">
                    {formatClockTime(entry.day.checkInAt)} / {formatClockTime(entry.day.checkOutAt)}
                  </td>
                  <td className="py-2 text-body">{formatWorkedMinutes(entry.day.workedMinutes)}</td>
                  <td className="py-2 text-right">
                    {markingEmployeeId !== entry.employee.id && (
                      <Button
                        variant="secondary"
                        className="w-auto"
                        onClick={() => setMarkingEmployeeId(entry.employee.id)}
                      >
                        Mark / correct
                      </Button>
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
      )}
    </div>
  )
}
