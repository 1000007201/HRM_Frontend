import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useAttendanceSettings, useUpdateAttendanceSettings } from '../../features/attendance/hooks'
import { attendanceSettingsFormSchema, type AttendanceSettingsFormValues } from '../../features/attendance/validation'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function WeekOffSelector({
  value,
  onChange,
  disabled,
}: {
  value: number[]
  onChange: (days: number[]) => void
  disabled?: boolean
}) {
  function toggle(day: number) {
    if (disabled) return
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DAY_LABELS.map((label, index) => {
        const selected = value.includes(index)
        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => toggle(index)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-canvas text-ink-2 hover:bg-row-hover'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 py-1.5 text-sm text-ink-2 ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-accent/20"
      />
      {label}
    </label>
  )
}

function AttendanceSettingsForm() {
  const { data, isPending, isError, error } = useAttendanceSettings()
  const updateSettings = useUpdateAttendanceSettings()
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceSettingsFormValues>({
    resolver: zodResolver(attendanceSettingsFormSchema),
    defaultValues: {
      fullDayHours: 8,
      fullDayMinutes: 0,
      halfDayHours: 4,
      halfDayMinutes: 0,
      weekOffDays: [0, 6],
      allowRegularization: true,
      maxRegularizationsPerMonth: null,
      regularizationWindowDays: null,
    },
  })

  useEffect(() => {
    if (data) {
      const s = data.settings
      reset({
        fullDayHours: Math.floor(s.fullDayMinutes / 60),
        fullDayMinutes: s.fullDayMinutes % 60,
        halfDayHours: Math.floor(s.halfDayMinutes / 60),
        halfDayMinutes: s.halfDayMinutes % 60,
        weekOffDays: s.weekOffDays,
        allowRegularization: s.allowRegularization,
        maxRegularizationsPerMonth: s.maxRegularizationsPerMonth,
        regularizationWindowDays: s.regularizationWindowDays,
      })
    }
  }, [data, reset])

  const allowRegularization = watch('allowRegularization')

  async function handleFormSubmit(values: AttendanceSettingsFormValues) {
    setServerError('')
    setSaved(false)
    try {
      await updateSettings.mutateAsync({
        fullDayMinutes: values.fullDayHours * 60 + values.fullDayMinutes,
        halfDayMinutes: values.halfDayHours * 60 + values.halfDayMinutes,
        weekOffDays: values.weekOffDays,
        allowRegularization: values.allowRegularization,
        maxRegularizationsPerMonth: values.allowRegularization ? values.maxRegularizationsPerMonth : null,
        regularizationWindowDays: values.allowRegularization ? values.regularizationWindowDays : null,
      })
      setSaved(true)
    } catch (submitError) {
      setServerError(errorMessage(submitError, 'Could not save attendance settings. Please try again.'))
    }
  }

  if (isPending) return <LoadingState />

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load attendance settings.')}</p>
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-lg">
      {serverError && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      {saved && !serverError && (
        <p className="mb-4 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-ink-2">
          Attendance settings saved. Changes apply to future calculations only.
        </p>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Working hours</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-sm text-ink-2">Full day</p>
            <div className="flex items-center gap-2">
              <FormInput
                id="fullDayHours"
                label="Hours"
                type="number"
                min={0}
                max={23}
                {...register('fullDayHours', { valueAsNumber: true })}
                errorMessage={errors.fullDayHours?.message}
              />
              <FormInput
                id="fullDayMinutes"
                label="Min"
                type="number"
                min={0}
                max={59}
                {...register('fullDayMinutes', { valueAsNumber: true })}
                errorMessage={errors.fullDayMinutes?.message}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-ink-2">Half day</p>
            <div className="flex items-center gap-2">
              <FormInput
                id="halfDayHours"
                label="Hours"
                type="number"
                min={0}
                max={23}
                {...register('halfDayHours', { valueAsNumber: true })}
                errorMessage={errors.halfDayHours?.message}
              />
              <FormInput
                id="halfDayMinutes"
                label="Min"
                type="number"
                min={0}
                max={59}
                {...register('halfDayMinutes', { valueAsNumber: true })}
                errorMessage={errors.halfDayMinutes?.message}
              />
            </div>
          </div>
        </div>
        {errors.halfDayHours?.type === 'custom' && (
          <p className="mt-1 text-sm text-error">{errors.halfDayHours.message}</p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Weekly off days</h2>
        <WeekOffSelector
          value={watch('weekOffDays')}
          onChange={(days) => setValue('weekOffDays', days)}
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Regularization</h2>
        <div className="rounded-md border border-border bg-canvas p-3">
          <ToggleField
            label="Allow employees to request attendance regularization"
            checked={allowRegularization}
            onChange={(checked) => setValue('allowRegularization', checked)}
          />
        </div>
        {allowRegularization && (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <FormInput
              id="maxRegularizationsPerMonth"
              label="Max requests / month"
              type="number"
              min={1}
              placeholder="Unlimited"
              {...register('maxRegularizationsPerMonth', {
                setValueAs: (v: string) => (v === '' ? null : Number(v)),
              })}
              value={watch('maxRegularizationsPerMonth') ?? ''}
              errorMessage={errors.maxRegularizationsPerMonth?.message}
            />
            <FormInput
              id="regularizationWindowDays"
              label="Window (days)"
              type="number"
              min={1}
              placeholder="No limit"
              {...register('regularizationWindowDays', {
                setValueAs: (v: string) => (v === '' ? null : Number(v)),
              })}
              value={watch('regularizationWindowDays') ?? ''}
              errorMessage={errors.regularizationWindowDays?.message}
            />
          </div>
        )}
      </section>

      <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
        Save settings
      </Button>
    </form>
  )
}

function AttendanceSettingsReadOnly() {
  const { data, isPending, isError, error } = useAttendanceSettings()

  if (isPending) return <LoadingState />

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load attendance settings.')}</p>
  }

  const s = data.settings
  const fullDayLabel = `${Math.floor(s.fullDayMinutes / 60)}h ${s.fullDayMinutes % 60}m`
  const halfDayLabel = `${Math.floor(s.halfDayMinutes / 60)}h ${s.halfDayMinutes % 60}m`
  const weekOffLabel = s.weekOffDays.length > 0
    ? s.weekOffDays.map((d) => DAY_LABELS[d]).join(', ')
    : 'None'

  return (
    <div className="max-w-lg space-y-4 text-sm text-ink-2">
      <div>
        <p className="font-medium text-ink">Working hours</p>
        <p>Full day: {fullDayLabel} &middot; Half day: {halfDayLabel}</p>
      </div>
      <div>
        <p className="font-medium text-ink">Weekly off</p>
        <p>{weekOffLabel}</p>
      </div>
      <div>
        <p className="font-medium text-ink">Regularization</p>
        <p>
          {s.allowRegularization ? 'Enabled' : 'Disabled'}
          {s.allowRegularization && s.maxRegularizationsPerMonth != null && ` · Max ${s.maxRegularizationsPerMonth}/month`}
          {s.allowRegularization && s.regularizationWindowDays != null && ` · Within ${s.regularizationWindowDays} days`}
        </p>
      </div>
    </div>
  )
}

export function AttendanceSettingsPage() {
  const { canManageEmployees: isAdmin, isLoading } = useActiveMemberRole()

  if (isLoading) return <LoadingState />

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Attendance settings</h1>
      {isAdmin ? <AttendanceSettingsForm /> : <AttendanceSettingsReadOnly />}
    </div>
  )
}
