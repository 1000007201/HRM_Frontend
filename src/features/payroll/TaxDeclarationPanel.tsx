import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { currentFinancialYear, financialYearOptions, TAX_REGIME_LABELS } from './display'
import { useTaxDeclaration, useUpsertTaxDeclaration } from './hooks'
import { TAX_REGIMES } from './types'
import { taxDeclarationFormSchema, type TaxDeclarationFormValues } from './validation'

function toNumber(value: string | null): number | undefined {
  return value === null ? undefined : Number(value)
}

export function TaxDeclarationPanel({ employeeId }: { employeeId: string }) {
  const [financialYear, setFinancialYear] = useState(currentFinancialYear())
  const { data, isPending, isError, error } = useTaxDeclaration(employeeId, financialYear)
  const upsertTaxDeclaration = useUpsertTaxDeclaration(employeeId)
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaxDeclarationFormValues>({
    resolver: zodResolver(taxDeclarationFormSchema),
    defaultValues: { regime: 'NEW' },
  })

  useEffect(() => {
    const declaration = data?.declaration
    reset({
      regime: declaration?.regime ?? 'NEW',
      previousEmployerIncome: toNumber(declaration?.previousEmployerIncome ?? null),
      previousEmployerTds: toNumber(declaration?.previousEmployerTds ?? null),
      section80C: toNumber(declaration?.section80C ?? null),
      section80D: toNumber(declaration?.section80D ?? null),
      hraExemption: toNumber(declaration?.hraExemption ?? null),
      otherDeductions: toNumber(declaration?.otherDeductions ?? null),
    })
  }, [data, reset])

  const regime = watch('regime')

  async function handleFormSubmit(values: TaxDeclarationFormValues) {
    setServerError('')
    setSaved(false)
    try {
      await upsertTaxDeclaration.mutateAsync({ ...values, financialYear })
      setSaved(true)
    } catch (submitError) {
      setServerError(errorMessage(submitError, 'Could not save the tax declaration. Please try again.'))
    }
  }

  return (
    <div>
      <div className="mb-4 w-48">
        <FormSelect id="financialYear" label="Financial year" value={financialYear} onChange={(event) => setFinancialYear(event.target.value)}>
          {financialYearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </FormSelect>
      </div>

      {isPending ? (
        <LoadingState padding="py-4" />
      ) : isError ? (
        <p className="text-sm text-error">{errorMessage(error, 'Could not load the tax declaration.')}</p>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-md">
          {serverError && (
            <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
          )}
          {saved && !serverError && (
            <p className="mb-4 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-ink-2">
              Tax declaration saved.
            </p>
          )}

          <FormSelect id="regime" label="Tax regime" errorMessage={errors.regime?.message} {...register('regime')}>
            {TAX_REGIMES.map((option) => (
              <option key={option} value={option}>
                {TAX_REGIME_LABELS[option]}
              </option>
            ))}
          </FormSelect>

          {regime === 'OLD' && (
            <div className="mb-4 rounded-md border border-border bg-canvas p-3">
              <FormInput
                id="section80C"
                label="Section 80C (₹, max 1,50,000)"
                type="number"
                step="0.01"
                min="0"
                max="150000"
                errorMessage={errors.section80C?.message}
                {...register('section80C', { valueAsNumber: true })}
              />
              <FormInput
                id="section80D"
                label="Section 80D (₹)"
                type="number"
                step="0.01"
                min="0"
                errorMessage={errors.section80D?.message}
                {...register('section80D', { valueAsNumber: true })}
              />
              <FormInput
                id="hraExemption"
                label="HRA exemption (₹)"
                type="number"
                step="0.01"
                min="0"
                errorMessage={errors.hraExemption?.message}
                {...register('hraExemption', { valueAsNumber: true })}
              />
              <FormInput
                id="otherDeductions"
                label="Other deductions (₹)"
                type="number"
                step="0.01"
                min="0"
                errorMessage={errors.otherDeductions?.message}
                {...register('otherDeductions', { valueAsNumber: true })}
              />
            </div>
          )}

          <p className="mb-2 text-sm font-medium text-ink">Previous employer (this financial year)</p>
          <FormInput
            id="previousEmployerIncome"
            label="Previous employer income (₹)"
            type="number"
            step="0.01"
            min="0"
            errorMessage={errors.previousEmployerIncome?.message}
            {...register('previousEmployerIncome', { valueAsNumber: true })}
          />
          <FormInput
            id="previousEmployerTds"
            label="Previous employer TDS (₹)"
            type="number"
            step="0.01"
            min="0"
            errorMessage={errors.previousEmployerTds?.message}
            {...register('previousEmployerTds', { valueAsNumber: true })}
          />

          <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
            Save declaration
          </Button>
        </form>
      )}
    </div>
  )
}
