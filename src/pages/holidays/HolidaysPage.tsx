import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useCreateHoliday, useDeleteHoliday, useHolidays } from '../../features/holidays/hooks'
import type { Holiday } from '../../features/holidays/types'
import { holidayFormSchema, type HolidayFormValues } from '../../features/holidays/validation'
import { BulkAddHolidays } from '../../features/holidays/BulkAddHolidays'
import { LoadingState } from '../../components/ui/Spinner'

// timeZone: 'UTC' throughout — holiday dates are UTC-midnight calendar dates,
// so formatting them in the viewer's local zone would shift them a day west of
// Greenwich. See the note on Holiday.date.
const monthLabelFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
const dayFormatter = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', timeZone: 'UTC' })
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' })

const CURRENT_YEAR = new Date().getUTCFullYear()
const SELECTABLE_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]

// The list arrives ordered by date, so Map insertion order is already
// chronological — no sorting needed here.
function groupByMonth(holidays: Holiday[]): [string, Holiday[]][] {
  const holidaysByMonth = new Map<string, Holiday[]>()
  for (const holiday of holidays) {
    const monthLabel = monthLabelFormatter.format(new Date(holiday.date))
    holidaysByMonth.set(monthLabel, [...(holidaysByMonth.get(monthLabel) ?? []), holiday])
  }
  return [...holidaysByMonth]
}

function AddHolidayForm() {
  const createHoliday = useCreateHoliday()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { date: '', name: '' },
  })

  async function handleFormSubmit(values: HolidayFormValues) {
    setServerError('')
    try {
      await createHoliday.mutateAsync(values)
      reset()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not add the holiday. Please try again.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="rounded-md border border-card-border bg-charcoal-50 p-4">
      <p className="mb-3 text-sm font-medium text-heading">Add a holiday</p>
      {serverError && (
        <p className="mb-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <FormInput
          id="holidayDate"
          label="Date"
          type="date"
          className="bg-white"
          disabled={isSubmitting}
          errorMessage={errors.date?.message}
          {...register('date')}
        />
        <FormInput
          id="holidayName"
          label="Name"
          placeholder="Republic Day"
          className="bg-white"
          disabled={isSubmitting}
          errorMessage={errors.name?.message}
          {...register('name')}
        />
        <Button type="submit" className="mt-6 w-auto" isLoading={isSubmitting}>
          Add
        </Button>
      </div>
    </form>
  )
}

function HolidayList({ year, canManage }: { year: number; canManage: boolean }) {
  const { data, isPending, isError, error } = useHolidays(year)
  const deleteHoliday = useDeleteHoliday()

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return (
      <p className="text-sm text-error">
        {errorMessage(error, 'Could not load the holiday calendar. Please try again.')}
      </p>
    )
  }

  if (data.holidays.length === 0) {
    return <p className="text-sm text-secondary">No holidays added for {year}.</p>
  }

  return (
    <div>
      {deleteHoliday.isError && (
        <p className="mb-3 text-sm text-error">
          {errorMessage(deleteHoliday.error, 'Could not delete the holiday.')}
        </p>
      )}
      <div className="flex flex-col gap-6">
        {groupByMonth(data.holidays).map(([monthLabel, monthHolidays]) => (
          <div key={monthLabel}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary">{monthLabel}</p>
            <ul className="flex flex-col gap-2">
              {monthHolidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex items-center gap-4 rounded-md border border-card-border bg-white px-4 py-2"
                >
                  <span className="w-20 shrink-0 text-sm font-medium text-heading">
                    {dayFormatter.format(new Date(holiday.date))}
                  </span>
                  <span className="w-24 shrink-0 text-sm text-secondary">
                    {weekdayFormatter.format(new Date(holiday.date))}
                  </span>
                  <span className="flex-1 text-sm text-body">{holiday.name}</span>
                  {canManage && (
                    <Button
                      variant="secondary"
                      className="w-auto"
                      isLoading={deleteHoliday.isPending && deleteHoliday.variables === holiday.id}
                      onClick={() => deleteHoliday.mutate(holiday.id)}
                    >
                      Delete
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HolidaysPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  // Holidays are ADMIN/HR-managed, the same gate as employee management
  // (backend MANAGER_ROLES in src/routes/holidays.ts) — everyone else sees the
  // calendar read-only.
  const { canManageEmployees: canManage } = useActiveMemberRole()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-heading">Holiday calendar</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="holidayYear" className="text-sm text-secondary">
            Year
          </label>
          <select
            id="holidayYear"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-md border border-charcoal-100 bg-white px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {SELECTABLE_YEARS.map((selectableYear) => (
              <option key={selectableYear} value={selectableYear}>
                {selectableYear}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canManage && (
        <div className="mb-8 flex flex-col gap-4">
          <AddHolidayForm />
          <BulkAddHolidays year={year} />
        </div>
      )}

      <HolidayList year={year} canManage={canManage} />
    </div>
  )
}
