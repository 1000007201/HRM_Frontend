import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormSelect } from '../../components/ui/FormSelect'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { LOP_BASIS_LABELS } from '../../features/payroll/display'
import { usePayrollSettings, useUpdatePayrollSettings } from '../../features/payroll/hooks'
import { LOP_BASES } from '../../features/payroll/types'
import { payrollSettingsFormSchema, type PayrollSettingsFormValues } from '../../features/payroll/validation'

// No slab data exists for these yet (see the backend's ptSlabs.ts) — Professional
// Tax resolves to ₹0 for any other state until slabs are added there.
const PT_STATES = [
  { value: 'MAHARASHTRA', label: 'Maharashtra' },
  { value: 'KARNATAKA', label: 'Karnataka' },
]

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

function PayrollSettingsForm() {
  const { data, isPending, isError, error } = usePayrollSettings()
  const updatePayrollSettings = useUpdatePayrollSettings()
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<PayrollSettingsFormValues>({
    resolver: zodResolver(payrollSettingsFormSchema),
    defaultValues: { pfEnabled: true, pfCeiling: true, esiEnabled: true, ptEnabled: true, ptState: '', lopBasis: 'CALENDAR_DAYS' },
  })

  useEffect(() => {
    if (data) {
      reset({
        pfEnabled: data.settings.pfEnabled,
        pfCeiling: data.settings.pfCeiling,
        esiEnabled: data.settings.esiEnabled,
        ptEnabled: data.settings.ptEnabled,
        ptState: data.settings.ptState ?? '',
        lopBasis: data.settings.lopBasis,
      })
    }
  }, [data, reset])

  const ptEnabled = watch('ptEnabled')

  async function handleFormSubmit(values: PayrollSettingsFormValues) {
    setServerError('')
    setSaved(false)
    try {
      await updatePayrollSettings.mutateAsync({ ...values, ptState: values.ptState || null })
      setSaved(true)
    } catch (submitError) {
      setServerError(errorMessage(submitError, 'Could not save payroll settings. Please try again.'))
    }
  }

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load payroll settings.')}</p>
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-md">
      {serverError && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      {saved && !serverError && (
        <p className="mb-4 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-ink-2">
          Payroll settings saved.
        </p>
      )}

      <div className="mb-4 rounded-md border border-border bg-canvas p-3">
        <ToggleField label="PF enabled" checked={watch('pfEnabled')} onChange={(checked) => setValue('pfEnabled', checked)} />
        <ToggleField
          label="Cap PF wage base at ₹15,000 (Basic)"
          checked={watch('pfCeiling')}
          onChange={(checked) => setValue('pfCeiling', checked)}
          disabled={!watch('pfEnabled')}
        />
        <ToggleField label="ESI enabled" checked={watch('esiEnabled')} onChange={(checked) => setValue('esiEnabled', checked)} />
        <ToggleField label="Professional Tax enabled" checked={ptEnabled} onChange={(checked) => setValue('ptEnabled', checked)} />
      </div>

      <FormSelect id="ptState" label="Professional Tax state" disabled={!ptEnabled} openDirection="up" {...register('ptState')}>
        <option value="">Not set</option>
        {PT_STATES.map((state) => (
          <option key={state.value} value={state.value}>
            {state.label}
          </option>
        ))}
      </FormSelect>

      <FormSelect id="lopBasis" label="Loss-of-pay basis" openDirection="up" {...register('lopBasis')}>
        {LOP_BASES.map((basis) => (
          <option key={basis} value={basis}>
            {LOP_BASIS_LABELS[basis]}
          </option>
        ))}
      </FormSelect>

      <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
        Save settings
      </Button>
    </form>
  )
}

export function PayrollSettingsPage() {
  const { canManageEmployees: isAdmin, isLoading } = useActiveMemberRole()

  if (isLoading) {
    return <LoadingState />
  }

  if (!isAdmin) {
    return <p className="text-sm text-muted">You don't have access to manage payroll settings.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Payroll settings</h1>
      <PayrollSettingsForm />
    </div>
  )
}
